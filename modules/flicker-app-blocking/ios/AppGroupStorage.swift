import Foundation

/// Shared UserDefaults wrapper for communication between the main app and extensions.
/// Both the DeviceActivityMonitor extension and ShieldConfiguration extension
/// run in separate processes and need access to blocking state.
@available(iOS 16.0, *)
final class AppGroupStorage {
    static let shared = AppGroupStorage()

    private let suiteName = "group.com.thomascadle.flicker"
    private let defaults: UserDefaults

    private enum Keys {
        static let isBlocking = "flicker_is_blocking"
        static let blockingMode = "flicker_blocking_mode"
        static let selectedApps = "flicker_selected_apps"
        static let sessionMode = "flicker_session_mode"
        static let blockingExpiresAt = "flicker_blocking_expires_at"
    }

    private init() {
        defaults = UserDefaults(suiteName: suiteName) ?? .standard
    }

    // MARK: - Blocking State

    var isBlocking: Bool {
        get { defaults.bool(forKey: Keys.isBlocking) }
        set { defaults.set(newValue, forKey: Keys.isBlocking) }
    }

    /// "full" or "light"
    var blockingMode: String {
        get { defaults.string(forKey: Keys.blockingMode) ?? "full" }
        set { defaults.set(newValue, forKey: Keys.blockingMode) }
    }

    /// The session mode ("reset", "focus", "move") for shield customization
    var sessionMode: String {
        get { defaults.string(forKey: Keys.sessionMode) ?? "focus" }
        set { defaults.set(newValue, forKey: Keys.sessionMode) }
    }

    /// Epoch milliseconds when active blocking should be cleared.
    var blockingExpiresAt: Double {
        get { defaults.double(forKey: Keys.blockingExpiresAt) }
        set { defaults.set(newValue, forKey: Keys.blockingExpiresAt) }
    }

    // MARK: - Selected Apps (serialized FamilyActivitySelection tokens)

    var selectedAppsData: Data? {
        get { defaults.data(forKey: Keys.selectedApps) }
        set { defaults.set(newValue, forKey: Keys.selectedApps) }
    }

    // MARK: - Convenience

    func clear() {
        isBlocking = false
        blockingMode = "full"
        sessionMode = "focus"
        blockingExpiresAt = 0
    }
}
