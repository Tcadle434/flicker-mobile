//
//  AudioSessionManager.swift
//  Flicker
//
//  Created by Claude Code
//  Manages iOS audio session, background playback, and interruptions
//

import AVFoundation
import Foundation

// MARK: - Audio Session Manager

class AudioSessionManager {
    // MARK: - Singleton

    static let shared = AudioSessionManager()

    // MARK: - Properties

    private let audioSession = AVAudioSession.sharedInstance()
    private var isActive = false
    private var wasPlayingBeforeInterruption = false

    // Callbacks
    var onInterruptionBegan: (() -> Void)?
    var onInterruptionEnded: (() -> Void)?
    var onRouteChanged: ((AVAudioSession.RouteChangeReason) -> Void)?

    // MARK: - Initialization

    private init() {
        print("[AudioSessionManager] Instance created")
        setupObservers()
    }

    deinit {
        removeObservers()
    }

    // MARK: - Configuration

    /// Configure audio session for playback with background support
    func configure() throws {
        print("[AudioSessionManager] Configuring audio session...")

        do {
            // Set category to playback with mix with others option
            try audioSession.setCategory(
                .playback,
                mode: .default,
                options: [.mixWithOthers]
            )

            // Activate session
            try audioSession.setActive(true, options: [])
            isActive = true

            print("[AudioSessionManager] ✅ Audio session configured successfully")
            print("  - Category: playback")
            print("  - Mode: default")
            print("  - Options: mixWithOthers")
            print("  - Sample rate: \(audioSession.sampleRate) Hz")
            print("  - IO buffer duration: \(audioSession.ioBufferDuration * 1000) ms")
        } catch {
            print("[AudioSessionManager] ❌ Failed to configure audio session: \(error)")
            throw error
        }
    }

    /// Configure audio session for background playback only (no mixing)
    func configureForBackgroundOnly() throws {
        print("[AudioSessionManager] Configuring for background-only playback...")

        do {
            // Set category without mixing
            try audioSession.setCategory(
                .playback,
                mode: .default,
                options: []
            )

            try audioSession.setActive(true, options: [])
            isActive = true

            print("[AudioSessionManager] ✅ Configured for background-only playback")
        } catch {
            print("[AudioSessionManager] ❌ Failed to configure: \(error)")
            throw error
        }
    }

    /// Deactivate the audio session
    func deactivate() {
        guard isActive else { return }

        do {
            try audioSession.setActive(false, options: [.notifyOthersOnDeactivation])
            isActive = false
            print("[AudioSessionManager] Audio session deactivated")
        } catch {
            print("[AudioSessionManager] Failed to deactivate: \(error)")
        }
    }

    // MARK: - Notification Observers

    private func setupObservers() {
        let notificationCenter = NotificationCenter.default

        // Interruption notifications (calls, alarms, etc.)
        notificationCenter.addObserver(
            self,
            selector: #selector(handleInterruption),
            name: AVAudioSession.interruptionNotification,
            object: audioSession
        )

        // Route change notifications (headphones plug/unplug)
        notificationCenter.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: audioSession
        )

        // Media services reset (rare, but can happen)
        notificationCenter.addObserver(
            self,
            selector: #selector(handleMediaServicesReset),
            name: AVAudioSession.mediaServicesWereResetNotification,
            object: audioSession
        )

        print("[AudioSessionManager] Observers set up")
    }

    private func removeObservers() {
        NotificationCenter.default.removeObserver(self)
        print("[AudioSessionManager] Observers removed")
    }

    // MARK: - Interruption Handling

    @objc private func handleInterruption(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }

        switch type {
        case .began:
            // Interruption began (phone call, alarm, etc.)
            print("[AudioSessionManager] 📞 Interruption began")
            wasPlayingBeforeInterruption = FlickerAudioEngine.shared.isRunning
            onInterruptionBegan?()

        case .ended:
            // Interruption ended
            print("[AudioSessionManager] ✅ Interruption ended")

            guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else {
                return
            }

            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)

            if options.contains(.shouldResume) {
                // System suggests we should resume playback
                print("[AudioSessionManager] System suggests resuming playback")

                if wasPlayingBeforeInterruption {
                    onInterruptionEnded?()
                }
            } else {
                print("[AudioSessionManager] System suggests NOT resuming")
            }

        @unknown default:
            print("[AudioSessionManager] Unknown interruption type")
        }
    }

    // MARK: - Route Change Handling

    @objc private func handleRouteChange(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }

        print("[AudioSessionManager] 🎧 Route changed: \(routeChangeReasonString(reason))")

        switch reason {
        case .newDeviceAvailable:
            // New device connected (e.g., headphones plugged in)
            print("[AudioSessionManager] New audio device available")
            logCurrentRoute()

        case .oldDeviceUnavailable:
            // Device disconnected (e.g., headphones unplugged)
            print("[AudioSessionManager] Audio device disconnected")

            // Check if headphones were unplugged
            if let previousRoute = userInfo[AVAudioSessionRouteChangePreviousRouteKey] as? AVAudioSessionRouteDescription {
                let wasUsingHeadphones = previousRoute.outputs.contains { output in
                    output.portType == .headphones || output.portType == .bluetoothA2DP
                }

                if wasUsingHeadphones {
                    print("[AudioSessionManager] Headphones unplugged - pausing playback")
                    // You might want to pause playback here
                }
            }

            logCurrentRoute()

        case .categoryChange:
            print("[AudioSessionManager] Category changed")

        case .override:
            print("[AudioSessionManager] Route override")

        case .wakeFromSleep:
            print("[AudioSessionManager] Device woke from sleep")

        case .noSuitableRouteForCategory:
            print("[AudioSessionManager] ⚠️ No suitable route for category")

        case .routeConfigurationChange:
            print("[AudioSessionManager] Route configuration changed")

        @unknown default:
            print("[AudioSessionManager] Unknown route change reason")
        }

        onRouteChanged?(reason)
    }

    // MARK: - Media Services Reset

    @objc private func handleMediaServicesReset() {
        print("[AudioSessionManager] ⚠️ Media services were reset")
        print("[AudioSessionManager] Reconfiguring audio session...")

        // Reconfigure the audio session
        do {
            try configure()
            print("[AudioSessionManager] ✅ Reconfiguration successful")
        } catch {
            print("[AudioSessionManager] ❌ Reconfiguration failed: \(error)")
        }
    }

    // MARK: - Utility Methods

    private func logCurrentRoute() {
        let currentRoute = audioSession.currentRoute
        print("[AudioSessionManager] Current route:")

        for output in currentRoute.outputs {
            print("  Output: \(output.portName) (\(output.portType.rawValue))")
        }

        for input in currentRoute.inputs {
            print("  Input: \(input.portName) (\(input.portType.rawValue))")
        }
    }

    private func routeChangeReasonString(_ reason: AVAudioSession.RouteChangeReason) -> String {
        switch reason {
        case .unknown: return "unknown"
        case .newDeviceAvailable: return "new device available"
        case .oldDeviceUnavailable: return "old device unavailable"
        case .categoryChange: return "category change"
        case .override: return "override"
        case .wakeFromSleep: return "wake from sleep"
        case .noSuitableRouteForCategory: return "no suitable route"
        case .routeConfigurationChange: return "configuration change"
        @unknown default: return "unknown"
        }
    }

    // MARK: - State Query

    func getState() -> [String: Any] {
        let currentRoute = audioSession.currentRoute

        var outputs: [[String: String]] = []
        for output in currentRoute.outputs {
            outputs.append([
                "name": output.portName,
                "type": output.portType.rawValue
            ])
        }

        return [
            "isActive": isActive,
            "category": audioSession.category.rawValue,
            "mode": audioSession.mode.rawValue,
            "sampleRate": audioSession.sampleRate,
            "ioBufferDuration": audioSession.ioBufferDuration,
            "outputs": outputs
        ]
    }
}
