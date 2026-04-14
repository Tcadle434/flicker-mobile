import DeviceActivity
import ManagedSettings
import FamilyControls
import Foundation

/// Extension that runs in its own process — re-applies or clears shields
/// when the DeviceActivity interval starts/ends. This ensures blocking
/// persists even if the main Flicker app is killed.
@available(iOS 16.0, *)
class FlickerDeviceActivityMonitor: DeviceActivityMonitor {

    private let store = ManagedSettingsStore()

    override func intervalDidStart(for activity: DeviceActivityName) {
        super.intervalDidStart(for: activity)

        guard activity == .flickerSession else { return }

        let storage = AppGroupStorage.shared
        guard storage.isBlocking else { return }

        // Re-apply shields based on stored blocking mode
        applyShield(mode: storage.blockingMode)
    }

    override func intervalDidEnd(for activity: DeviceActivityName) {
        super.intervalDidEnd(for: activity)

        guard activity == .flickerSession else { return }

        // Clear shields when interval ends
        clearShields()

        AppGroupStorage.shared.clear()
    }

    override func eventDidReachThreshold(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        super.eventDidReachThreshold(event, activity: activity)
        // Not used currently, but available for future time-based events
    }

    // MARK: - Private

    private func applyShield(mode: String) {
        clearShields()

        switch mode {
        case "full":
            if let data = AppGroupStorage.shared.selectedAppsData,
               let sel = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data),
               !sel.applicationTokens.isEmpty {
                store.shield.applicationCategories = .all(except: sel.applicationTokens)
            } else {
                store.shield.applicationCategories = .all()
            }
            store.shield.webDomainCategories = .all()

        case "light":
            // In light mode, restore user's selected apps from shared storage
            if let data = AppGroupStorage.shared.selectedAppsData,
               let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
                if !selection.applicationTokens.isEmpty {
                    store.shield.applications = selection.applicationTokens
                }
                if !selection.webDomainTokens.isEmpty {
                    store.shield.webDomains = selection.webDomainTokens
                }
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
}

// MARK: - Shared DeviceActivityName

extension DeviceActivityName {
    static let flickerSession = DeviceActivityName("com.flicker.session")
}
