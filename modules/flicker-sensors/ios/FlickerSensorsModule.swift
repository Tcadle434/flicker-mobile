//
//  FlickerSensorsModule.swift
//  Flicker
//
//  Created by Codex
//  Expo Module bridge for location signals
//

import ExpoModulesCore
import CoreLocation

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

public class FlickerSensorsModule: Module {
    private let locationManager = CLLocationManager()
    private let locationDelegate = LocationDelegate()
    private var locationPromise: Promise?

    public func definition() -> ModuleDefinition {
        Name("FlickerSensors")

        AsyncFunction("getCurrentLocation") { (promise: Promise) in
            self.requestCurrentLocation(promise: promise)
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
        print("[FlickerSensorsModule] Location error: \(error.localizedDescription)")
        promise.resolve(nil)
    }
}
