import Foundation

/// Shared UserDefaults wrapper — file copy for extension process.
/// Extensions run in separate processes and cannot import main app code.
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

    var isBlocking: Bool {
        get { defaults.bool(forKey: Keys.isBlocking) }
        set { defaults.set(newValue, forKey: Keys.isBlocking) }
    }

    var blockingMode: String {
        get { defaults.string(forKey: Keys.blockingMode) ?? "full" }
        set { defaults.set(newValue, forKey: Keys.blockingMode) }
    }

    var sessionMode: String {
        get { defaults.string(forKey: Keys.sessionMode) ?? "focus" }
        set { defaults.set(newValue, forKey: Keys.sessionMode) }
    }

    var blockingExpiresAt: Double {
        get { defaults.double(forKey: Keys.blockingExpiresAt) }
        set { defaults.set(newValue, forKey: Keys.blockingExpiresAt) }
    }

    var selectedAppsData: Data? {
        get { defaults.data(forKey: Keys.selectedApps) }
        set { defaults.set(newValue, forKey: Keys.selectedApps) }
    }

    func clear() {
        isBlocking = false
        blockingMode = "full"
        sessionMode = "focus"
        blockingExpiresAt = 0
    }
}
