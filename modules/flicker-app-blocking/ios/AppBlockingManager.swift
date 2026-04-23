import Foundation
import FamilyControls
import ManagedSettings
import DeviceActivity

/// Core singleton managing FamilyControls authorization, ManagedSettings shield application,
/// and DeviceActivity scheduling. This ensures app blocking persists even if the app is killed.
@available(iOS 16.0, *)
final class AppBlockingManager {
    static let shared = AppBlockingManager()

    private let center = AuthorizationCenter.shared
    private let store = ManagedSettingsStore()
    private let deviceActivityCenter = DeviceActivityCenter()
    private let storage = AppGroupStorage.shared

    private init() {}

    // MARK: - Authorization

    var authorizationStatus: AuthorizationStatus {
        center.authorizationStatus
    }

    /// Request FamilyControls authorization. Must be called before any blocking.
    func requestAuthorization() async throws {
        try await center.requestAuthorization(for: .individual)
    }

    // MARK: - Blocking

    /// Start blocking apps based on the given mode.
    /// - Parameters:
    ///   - mode: "full" blocks all apps, "light" blocks only social/entertainment
    ///   - sessionMode: "reset", "focus", or "move" — stored for shield UI customization
    ///   - expiresAt: epoch milliseconds when shields should be cleared if the main app is killed
    func startBlocking(mode: String, sessionMode: String, expiresAt: Double) throws {
        guard center.authorizationStatus == .approved else {
            throw AppBlockingError.notAuthorized
        }

        guard expiresAt > currentTimeMs else {
            stopBlocking()
            return
        }

        storage.isBlocking = true
        storage.blockingMode = mode
        storage.sessionMode = sessionMode
        storage.blockingExpiresAt = expiresAt

        applyShield(mode: mode)
        scheduleDeviceActivity(expiresAt: expiresAt)
    }

    /// Stop all blocking and remove shields.
    func stopBlocking() {
        storage.clear()

        clearShields()

        deviceActivityCenter.stopMonitoring()
    }

    /// Re-apply shields (called by DeviceActivityMonitor extension on interval start).
    func reapplyShields() {
        guard storage.isBlocking else { return }
        if clearExpiredBlockingIfNeeded() {
            return
        }
        applyShield(mode: storage.blockingMode)
    }

    /// Clear stale shields whose owning session has already reached its expected end.
    @discardableResult
    func clearExpiredBlockingIfNeeded() -> Bool {
        guard storage.isBlocking else { return false }
        guard isBlockingExpired else { return false }
        stopBlocking()
        return true
    }

    // MARK: - App Selection

    /// Present the FamilyActivityPicker and save selection.
    func presentAppPicker() async throws -> Bool {
        guard center.authorizationStatus == .approved else {
            throw AppBlockingError.notAuthorized
        }

        let data = try await ActivitySelectionManager.shared.presentPicker()
        if let data = data {
            storage.selectedAppsData = data
            return true
        }
        return false
    }

    // MARK: - Private

    private func applyShield(mode: String) {
        let selection = ActivitySelectionManager.shared

        // Restore saved selection if available
        if let data = storage.selectedAppsData {
            selection.restoreSelection(from: data)
        }

        clearShields()

        switch mode {
        case "full":
            // Block all applications except those in the user's allowlist
            if let data = storage.selectedAppsData,
               let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data),
               !sel.applicationTokens.isEmpty {
                store.shield.applicationCategories = .all(except: sel.applicationTokens)
            } else {
                store.shield.applicationCategories = .all()
            }
            store.shield.webDomainCategories = .all()

        case "light":
            // Light mode: block only user-selected apps/domains.
            // If no selection exists, skip blocking to avoid unintentionally blocking everything.
            let sel = selection.activitySelection
            if !sel.applicationTokens.isEmpty {
                store.shield.applications = sel.applicationTokens
            }
            if !sel.webDomainTokens.isEmpty {
                store.shield.webDomains = sel.webDomainTokens
            }

        default:
            store.shield.applicationCategories = .all()
            store.shield.webDomainCategories = .all()
        }
    }

    private func clearShields() {
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
        store.shield.webDomainCategories = nil
    }

    private var currentTimeMs: Double {
        Date().timeIntervalSince1970 * 1000
    }

    private var isBlockingExpired: Bool {
        // Treat legacy or malformed blocking state as expired so shields cannot
        // become permanent after an app update or interrupted write.
        storage.blockingExpiresAt <= 0 || currentTimeMs >= storage.blockingExpiresAt
    }

    private func scheduleDeviceActivity(expiresAt: Double) {
        // The extension owns cleanup if the main app is killed before stopBlocking runs.
        let calendar = Calendar.current
        let now = Date()
        let endDate = Date(timeIntervalSince1970: expiresAt / 1000)
        guard endDate > now else {
            stopBlocking()
            return
        }

        let schedule = DeviceActivitySchedule(
            intervalStart: calendar.dateComponents(
                [.year, .month, .day, .hour, .minute, .second],
                from: now
            ),
            intervalEnd: calendar.dateComponents(
                [.year, .month, .day, .hour, .minute, .second],
                from: endDate
            ),
            repeats: false
        )

        do {
            try deviceActivityCenter.startMonitoring(
                .flickerSession,
                during: schedule
            )
        } catch {
            // Monitoring failed — shields are still applied directly
            print("[AppBlockingManager] Failed to schedule device activity: \(error)")
        }
    }
}

// MARK: - DeviceActivityName Extension

extension DeviceActivityName {
    static let flickerSession = DeviceActivityName("com.flicker.session")
}
