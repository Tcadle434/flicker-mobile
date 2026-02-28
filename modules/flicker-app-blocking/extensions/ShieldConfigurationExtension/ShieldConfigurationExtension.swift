import ManagedSettings
import ManagedSettingsUI
import UIKit

/// Custom shield UI matching Flicker's dark theme with branded messaging.
/// This replaces the default iOS shield screen with a Flicker-branded experience.
@available(iOS 16.0, *)
class FlickerShieldConfigurationProvider: ShieldConfigurationDataSource {

    override func configuration(shielding application: Application) -> ShieldConfiguration {
        return buildShieldConfig()
    }

    override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
        return buildShieldConfig()
    }

    override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
        return buildShieldConfig()
    }

    override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
        return buildShieldConfig()
    }

    // MARK: - Private

    private func buildShieldConfig() -> ShieldConfiguration {
        let storage = AppGroupStorage.shared
        let sessionMode = storage.sessionMode

        let (title, subtitle, accentColor) = modeContent(for: sessionMode)

        return ShieldConfiguration(
            backgroundBlurStyle: .systemUltraThinMaterialDark,
            backgroundColor: UIColor(red: 0.04, green: 0.04, blue: 0.043, alpha: 0.95),
            icon: nil,
            title: ShieldConfiguration.Label(
                text: title,
                color: accentColor
            ),
            subtitle: ShieldConfiguration.Label(
                text: subtitle,
                color: UIColor(white: 1.0, alpha: 0.5)
            ),
            primaryButtonLabel: ShieldConfiguration.Label(
                text: "Back to Flicker",
                color: UIColor(red: 0.04, green: 0.04, blue: 0.043, alpha: 1.0)
            ),
            primaryButtonBackgroundColor: accentColor
        )
    }

    private func modeContent(for mode: String) -> (String, String, UIColor) {
        switch mode {
        case "reset":
            return (
                "Stay present.",
                "Your Reset session is active.\nThis app is blocked to protect your calm.",
                UIColor(red: 0.49, green: 0.827, blue: 0.988, alpha: 1.0) // #7DD3FC
            )
        case "focus":
            return (
                "Stay focused.",
                "Your Focus session is active.\nThis app is blocked to protect your flow.",
                UIColor(red: 0.369, green: 0.918, blue: 0.831, alpha: 1.0) // #5EEAD4
            )
        case "move":
            return (
                "Keep moving.",
                "Your Move session is active.\nStay off your phone and stay active.",
                UIColor(red: 0.204, green: 0.827, blue: 0.6, alpha: 1.0) // #34D399
            )
        default:
            return (
                "Stay focused.",
                "A Flicker session is active.\nThis app is temporarily blocked.",
                UIColor(red: 0.369, green: 0.918, blue: 0.831, alpha: 1.0)
            )
        }
    }
}
