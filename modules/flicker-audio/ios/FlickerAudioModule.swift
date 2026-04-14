//
//  FlickerAudioModule.swift
//  Flicker
//
//  Created by Claude Code
//  Expo Module bridge for native audio engine
//

import ExpoModulesCore
import AVFoundation

// MARK: - Module Definition

public class FlickerAudioModule: Module {
    // MARK: - Module Configuration

    public func definition() -> ModuleDefinition {
        Name("FlickerAudio")

        // MARK: - Events

        Events("playbackStateChanged", "error", "loopTransitioned")

        // MARK: - Lifecycle Methods

        AsyncFunction("initialize") { (promise: Promise) in
            do {
                try FlickerAudioCoordinator.shared.initialize()
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to initialize audio engine: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "INIT_ERROR"
                ])
                promise.reject("INIT_ERROR", errorMessage)
            }
        }

        AsyncFunction("dispose") { (promise: Promise) in
            FlickerAudioCoordinator.shared.dispose()
            promise.resolve(["success": true])
        }

        AsyncFunction("prewarmAssets") { (assetIds: [String], promise: Promise) in
            FlickerAudioCoordinator.shared.prewarmAssets(assetIds)
            promise.resolve(["success": true])
        }

        AsyncFunction("configureShellAssets") { (ambientAsset: String?, uiSounds: [String: String], promise: Promise) in
            FlickerAudioCoordinator.shared.configureShellAssets(ambientAsset: ambientAsset, uiSounds: uiSounds)
            promise.resolve(["success": true])
        }

        AsyncFunction("enterScene") { (scene: String, promise: Promise) in
            do {
                try FlickerAudioCoordinator.shared.enterScene(scene)
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to enter scene: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "SCENE_ERROR"
                ])
                promise.reject("SCENE_ERROR", errorMessage)
            }
        }

        AsyncFunction("startSession") { (config: [String: Any], layers: [[String: Any]], promise: Promise) in
            do {
                try FlickerAudioCoordinator.shared.startSession(config: config, layers: layers)
                self.sendEvent("playbackStateChanged", ["state": "playing"])
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to start session: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "START_SESSION_ERROR"
                ])
                promise.reject("START_SESSION_ERROR", errorMessage)
            }
        }

        AsyncFunction("switchResetPreset") { (preset: String, layers: [[String: Any]], promise: Promise) in
            do {
                try FlickerAudioCoordinator.shared.switchResetPreset(preset, layers: layers)
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to switch reset preset: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "SWITCH_RESET_PRESET_ERROR"
                ])
                promise.reject("SWITCH_RESET_PRESET_ERROR", errorMessage)
            }
        }

        AsyncFunction("applyResetCustomConfig") { (config: [String: Any], layers: [[String: Any]], promise: Promise) in
            do {
                try FlickerAudioCoordinator.shared.applyResetCustomConfig(config, layers: layers)
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to apply reset custom config: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "RESET_CUSTOM_ERROR"
                ])
                promise.reject("RESET_CUSTOM_ERROR", errorMessage)
            }
        }

        AsyncFunction("setSessionPhase") { (phase: String, promise: Promise) in
            FlickerAudioCoordinator.shared.setSessionPhase(phase)
            promise.resolve(["success": true])
        }

        AsyncFunction("endSession") { (reason: String, promise: Promise) in
            FlickerAudioCoordinator.shared.endSession(reason: reason)
            self.sendEvent("playbackStateChanged", ["state": "stopped"])
            promise.resolve(["success": true])
        }

        // MARK: - Playback Control

        AsyncFunction("play") { (promise: Promise) in
            do {
                try FlickerAudioEngine.shared.play()
                self.sendEvent("playbackStateChanged", ["state": "playing"])
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to start playback: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "PLAY_ERROR"
                ])
                promise.reject("PLAY_ERROR", errorMessage)
            }
        }

        AsyncFunction("pause") { (promise: Promise) in
            FlickerAudioEngine.shared.pause()
            self.sendEvent("playbackStateChanged", ["state": "paused"])
            promise.resolve(["success": true])
        }

        AsyncFunction("stop") { (promise: Promise) in
            FlickerAudioEngine.shared.stop()
            self.sendEvent("playbackStateChanged", ["state": "stopped"])
            promise.resolve(["success": true])
        }

        // MARK: - Volume Control

        AsyncFunction("setMasterVolume") { (volume: Float, fadeMs: Float, promise: Promise) in
            let fadeTime = TimeInterval(fadeMs / 1000.0)
            FlickerAudioCoordinator.shared.setMasterVolume(volume, fadeTime: fadeTime)
            promise.resolve(["success": true])
        }

        AsyncFunction("setMuted") { (muted: Bool, promise: Promise) in
            FlickerAudioCoordinator.shared.setMuted(muted)
            promise.resolve(["success": true])
        }

        AsyncFunction("setLayerVolume") { (layer: String, volume: Float, fadeMs: Float, promise: Promise) in
            let fadeTime = TimeInterval(fadeMs / 1000.0)
            FlickerAudioEngine.shared.setLayerVolume(layer: layer, volume: volume, fadeTime: fadeTime)
            promise.resolve(["success": true])
        }

        AsyncFunction("setLayerMuted") { (layer: String, muted: Bool, promise: Promise) in
            FlickerAudioEngine.shared.setLayerMuted(layer: layer, muted: muted)
            promise.resolve(["success": true])
        }

        AsyncFunction("setLayerLoop") { (layer: String, loopId: String, filename: String, volume: Float, fadeMs: Float, promise: Promise) in
            let fadeTime = TimeInterval(fadeMs / 1000.0)
            do {
                try FlickerAudioEngine.shared.setLayerLoop(layer: layer, loopId: loopId, filename: filename, volume: volume, fadeTime: fadeTime)
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to set layer loop: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "SET_LAYER_LOOP_ERROR"
                ])
                promise.reject("SET_LAYER_LOOP_ERROR", errorMessage)
            }
        }

        // MARK: - Mode Loading (Phase 2+)

        AsyncFunction("loadMode") { (mode: String, layers: [[String: Any]], promise: Promise) in
            do {
                try FlickerAudioEngine.shared.loadMode(mode: mode, layers: layers)
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to load mode: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "LOAD_MODE_ERROR"
                ])
                promise.reject("LOAD_MODE_ERROR", errorMessage)
            }
        }

        // MARK: - State Query

        AsyncFunction("getState") { (promise: Promise) in
            let state = FlickerAudioEngine.shared.getState()
            promise.resolve(state)
        }

        AsyncFunction("playOneShot") { (name: String, promise: Promise) in
            do {
                try FlickerAudioCoordinator.shared.playOneShot(name)
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to play one-shot: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "ONE_SHOT_ERROR"
                ])
                promise.reject("ONE_SHOT_ERROR", errorMessage)
            }
        }

        AsyncFunction("getDebugState") { (promise: Promise) in
            promise.resolve(FlickerAudioCoordinator.shared.getDebugState())
        }

        // MARK: - Test Tone Generation (Phase 1)

        AsyncFunction("playTestTone") { (frequency: Float, duration: Float, promise: Promise) in
            do {
                try FlickerAudioEngine.shared.playTestTone(frequency: frequency, duration: TimeInterval(duration))
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to play test tone: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "TEST_TONE_ERROR"
                ])
                promise.reject("TEST_TONE_ERROR", errorMessage)
            }
        }

        AsyncFunction("enableMultiLayerMode") { (promise: Promise) in
            do {
                try FlickerAudioEngine.shared.enableMultiLayerMode()
                promise.resolve(["success": true])
            } catch {
                let errorMessage = "Failed to enable multi-layer mode: \(error.localizedDescription)"
                print("[FlickerAudioModule] \(errorMessage)")
                self.sendEvent("error", [
                    "message": errorMessage,
                    "code": "MULTILAYER_ERROR"
                ])
                promise.reject("MULTILAYER_ERROR", errorMessage)
            }
        }

        // MARK: - Effects Control (Phase 4)

        AsyncFunction("setReverbEnabled") { (enabled: Bool, promise: Promise) in
            FlickerAudioEngine.shared.setReverbEnabled(enabled)
            promise.resolve(["success": true])
        }

        AsyncFunction("setReverbWetDryMix") { (mix: Float, promise: Promise) in
            FlickerAudioEngine.shared.setReverbWetDryMix(mix)
            promise.resolve(["success": true])
        }

        AsyncFunction("setReverbRoomSize") { (size: Float, promise: Promise) in
            FlickerAudioEngine.shared.setReverbRoomSize(size)
            promise.resolve(["success": true])
        }

        AsyncFunction("setFilterEnabled") { (enabled: Bool, promise: Promise) in
            FlickerAudioEngine.shared.setFilterEnabled(enabled)
            promise.resolve(["success": true])
        }

        AsyncFunction("setFilterCutoff") { (frequency: Float, promise: Promise) in
            FlickerAudioEngine.shared.setFilterCutoff(frequency)
            promise.resolve(["success": true])
        }

        AsyncFunction("setCompressorEnabled") { (enabled: Bool, promise: Promise) in
            FlickerAudioEngine.shared.setCompressorEnabled(enabled)
            promise.resolve(["success": true])
        }

        AsyncFunction("setCompressorWetDryMix") { (mix: Float, promise: Promise) in
            FlickerAudioEngine.shared.setCompressorWetDryMix(mix)
            promise.resolve(["success": true])
        }

        AsyncFunction("applyEffectsPreset") { (preset: String, promise: Promise) in
            FlickerAudioEngine.shared.applyEffectsPreset(preset)
            promise.resolve(["success": true])
        }
    }
}
