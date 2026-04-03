import ExpoModulesCore
import FamilyControls

public class FlickerAppBlockingModule: Module {
    public func definition() -> ModuleDefinition {
        Name("FlickerAppBlocking")

        // MARK: - Authorization

        AsyncFunction("requestAuthorization") { () -> [String: Any] in
            guard #available(iOS 16.0, *) else {
                return ["success": false, "error": "Requires iOS 16.0+"]
            }
            do {
                try await AppBlockingManager.shared.requestAuthorization()
                return ["success": true]
            } catch {
                return ["success": false, "error": error.localizedDescription]
            }
        }

        AsyncFunction("getAuthorizationStatus") { () -> [String: Any] in
            guard #available(iOS 16.0, *) else {
                return ["status": "unavailable"]
            }
            let status = AppBlockingManager.shared.authorizationStatus
            let statusString: String
            switch status {
            case .notDetermined:
                statusString = "notDetermined"
            case .approved:
                statusString = "approved"
            case .denied:
                statusString = "denied"
            @unknown default:
                statusString = "unknown"
            }
            return ["status": statusString]
        }

        // MARK: - Blocking Control

        AsyncFunction("startBlocking") { (mode: String, sessionMode: String) -> [String: Any] in
            guard #available(iOS 16.0, *) else {
                return ["success": false, "error": "Requires iOS 16.0+"]
            }
            do {
                try AppBlockingManager.shared.startBlocking(mode: mode, sessionMode: sessionMode)
                return ["success": true]
            } catch {
                return ["success": false, "error": error.localizedDescription]
            }
        }

        AsyncFunction("stopBlocking") { () -> [String: Any] in
            guard #available(iOS 16.0, *) else {
                return ["success": false, "error": "Requires iOS 16.0+"]
            }
            AppBlockingManager.shared.stopBlocking()
            return ["success": true]
        }

        // MARK: - App Picker

        AsyncFunction("presentAppPicker") { () -> [String: Any] in
            guard #available(iOS 16.0, *) else {
                return ["success": false, "error": "Requires iOS 16.0+"]
            }
            do {
                let selected = try await AppBlockingManager.shared.presentAppPicker()
                return ["success": selected]
            } catch {
                return ["success": false, "error": error.localizedDescription]
            }
        }

        // MARK: - State Query

        AsyncFunction("getBlockingState") { () -> [String: Any] in
            guard #available(iOS 16.0, *) else {
                return ["isBlocking": false, "mode": "none"]
            }
            let storage = AppGroupStorage.shared
            return [
                "isBlocking": storage.isBlocking,
                "mode": storage.blockingMode,
                "sessionMode": storage.sessionMode,
            ]
        }
    }
}
