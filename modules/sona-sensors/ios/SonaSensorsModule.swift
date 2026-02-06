//
//  SonaSensorsModule.swift
//  Sona
//
//  Created by Codex
//  Expo Module bridge for location + HealthKit signals
//

import ExpoModulesCore
import CoreLocation
import HealthKit

private final class LocationDelegate: NSObject, CLLocationManagerDelegate {
    var onAuthorizationChanged: ((CLLocationManager) -> Void)?
    var onLocations: (([CLLocation]) -> Void)?
    var onError: ((Error) -> Void)?

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        onAuthorizationChanged?(manager)
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        onLocations?(locations)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        onError?(error)
    }
}

public class SonaSensorsModule: Module {
    private let locationManager = CLLocationManager()
    private let locationDelegate = LocationDelegate()
    private var locationPromise: Promise?
    private let healthStore = HKHealthStore()
    private var healthAuthInFlight = false

    public func definition() -> ModuleDefinition {
        Name("SonaSensors")

        AsyncFunction("getCurrentLocation") { (promise: Promise) in
            self.requestCurrentLocation(promise: promise)
        }

        AsyncFunction("getLatestHeartRate") { (promise: Promise) in
            self.requestLatestHeartRate(promise: promise)
        }

        OnCreate {
            self.locationDelegate.onAuthorizationChanged = { [weak self] manager in
                self?.handleAuthorizationChange(manager)
            }
            self.locationDelegate.onLocations = { [weak self] locations in
                self?.handleLocationsUpdate(locations)
            }
            self.locationDelegate.onError = { [weak self] error in
                self?.handleLocationError(error)
            }
            self.locationManager.delegate = self.locationDelegate
            self.locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        }
    }

    // MARK: - Location

    private func requestCurrentLocation(promise: Promise) {
        guard CLLocationManager.locationServicesEnabled() else {
            promise.resolve(nil)
            return
        }

        if locationPromise != nil {
            promise.resolve(nil)
            return
        }

        let status = locationManager.authorizationStatus
        switch status {
        case .notDetermined:
            locationPromise = promise
            locationManager.requestWhenInUseAuthorization()
        case .restricted, .denied:
            promise.resolve(nil)
        case .authorizedWhenInUse, .authorizedAlways:
            locationPromise = promise
            locationManager.requestLocation()
        @unknown default:
            promise.resolve(nil)
        }
    }

    private func handleAuthorizationChange(_ manager: CLLocationManager) {
        guard let promise = locationPromise else { return }

        let status = manager.authorizationStatus
        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        case .restricted, .denied:
            locationPromise = nil
            promise.resolve(nil)
        case .notDetermined:
            break
        @unknown default:
            locationPromise = nil
            promise.resolve(nil)
        }
    }

    private func handleLocationsUpdate(_ locations: [CLLocation]) {
        guard let promise = locationPromise else { return }
        locationPromise = nil

        if let location = locations.last {
            promise.resolve([
                "latitude": location.coordinate.latitude,
                "longitude": location.coordinate.longitude,
                "accuracy": location.horizontalAccuracy
            ])
        } else {
            promise.resolve(nil)
        }
    }

    private func handleLocationError(_ error: Error) {
        guard let promise = locationPromise else { return }
        locationPromise = nil
        print("[SonaSensorsModule] Location error: \(error.localizedDescription)")
        promise.resolve(nil)
    }

    // MARK: - HealthKit

    private func requestLatestHeartRate(promise: Promise) {
        guard HKHealthStore.isHealthDataAvailable() else {
            promise.resolve(nil)
            return
        }

        guard let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate) else {
            promise.resolve(nil)
            return
        }

        let readTypes: Set<HKObjectType> = [heartRateType]

        func executeQuery() {
            let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(sampleType: heartRateType,
                                      predicate: nil,
                                      limit: 1,
                                      sortDescriptors: [sortDescriptor]) { _, samples, error in
                if let error = error {
                    print("[SonaSensorsModule] Heart rate query error: \(error.localizedDescription)")
                    promise.resolve(nil)
                    return
                }

                guard let sample = samples?.first as? HKQuantitySample else {
                    promise.resolve(nil)
                    return
                }

                let bpm = sample.quantity.doubleValue(for: HKUnit(from: "count/min"))
                promise.resolve([
                    "bpm": bpm,
                    "variability": 0.0
                ])
            }
            self.healthStore.execute(query)
        }

        let authStatus = healthStore.authorizationStatus(for: heartRateType)
        switch authStatus {
        case .sharingAuthorized:
            executeQuery()
        case .notDetermined:
            if healthAuthInFlight {
                promise.resolve(nil)
                return
            }
            healthAuthInFlight = true
            healthStore.requestAuthorization(toShare: nil, read: readTypes) { success, error in
                self.healthAuthInFlight = false
                if let error = error {
                    print("[SonaSensorsModule] HealthKit auth error: \(error.localizedDescription)")
                    promise.resolve(nil)
                    return
                }
                if success {
                    executeQuery()
                } else {
                    promise.resolve(nil)
                }
            }
        case .sharingDenied:
            promise.resolve(nil)
        @unknown default:
            promise.resolve(nil)
        }
    }
}
