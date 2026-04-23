import AVFoundation
import Foundation

class FlickerAudioCoordinator {
    static let shared = FlickerAudioCoordinator()

    private let engine = FlickerAudioEngine.shared
    private let ambientTrackName = "main_app_background_music.m4a"
    private let ambientVolume: Float = 0.3
    private let resetSessionTargetVolume: Float = 0.72

    private var scene: String = "backgrounded"
    private var activePreset: String?
    private var activeModeLabel: String?
    private var ambientPlayer: AVAudioPlayer?
    private var ambientPlaybackPosition: TimeInterval = 0
    private var sfxPlayers: [String: AVAudioPlayer] = [:]
    private var ambientAssetPath: String?
    private var uiSoundAssetPaths: [String: String] = [:]
    private var shellMuted = false
    private var sessionMuted = false
    private var sessionPlaybackStoppedForMute = false
    private var masterVolume: Float = 0.8

    private init() {}

    private func isSessionScene(_ value: String) -> Bool {
        value == "focusSession" || value == "resetSession" || value == "moveSession"
    }

    private func currentSessionTargetVolume() -> Float {
        if scene == "resetSession" {
            return min(masterVolume, resetSessionTargetVolume)
        }

        return masterVolume
    }

    func initialize() throws {
        do {
            try prepareAmbientPlayerIfNeeded()
        } catch {
            print("[FlickerAudioCoordinator] Ambient player unavailable during initialize: \(error)")
        }
    }

    func dispose() {
        ambientPlayer?.stop()
        ambientPlayer = nil
        sfxPlayers.removeAll()
        activePreset = nil
        activeModeLabel = nil
        scene = "backgrounded"
        ambientPlaybackPosition = 0
        sessionPlaybackStoppedForMute = false
        engine.dispose()
    }

    func prewarmAssets(_ assetIds: [String]) {
        for assetId in assetIds {
            do {
                if assetId == ambientTrackName || assetId.contains("432Hz") || assetId.contains("binaural") {
                    _ = try AudioBufferManager.shared.loadPlaybackAsset(
                        fromFile: assetId,
                        preferStreaming: true
                    )
                } else {
                    _ = try AudioBufferManager.shared.loadPlaybackAsset(fromFile: assetId)
                }
            } catch {
                print("[FlickerAudioCoordinator] Prewarm failed for \(assetId): \(error)")
            }
        }

        _ = try? prepareSfxPlayerIfNeeded(name: "buttonPress", filename: "button_press.mp3")
        _ = try? prepareSfxPlayerIfNeeded(name: "shopOpen", filename: "shop_open.mp3")
        _ = try? prepareSfxPlayerIfNeeded(name: "dialogueContinue", filename: "dialogue_continue_press.mp3")
    }

    func configureShellAssets(ambientAsset: String?, uiSounds: [String: String]) {
        ambientAssetPath = ambientAsset
        uiSoundAssetPaths = uiSounds
        ambientPlayer = nil
        sfxPlayers.removeAll()

        do {
            try prepareAmbientPlayerIfNeeded()
        } catch {
            print("[FlickerAudioCoordinator] Failed to configure ambient asset: \(error)")
        }

        if scene == "shell" {
            resumeAmbientIfAllowed()
        }
    }

    func enterScene(_ nextScene: String) throws {
        let previousScene = scene
        scene = nextScene
        print("[FlickerAudioCoordinator] Entering scene: \(nextScene)")

        switch nextScene {
        case "shell":
            clearSessionAudio()
            resumeAmbientIfAllowed()
        case "backgrounded":
            pauseAmbient()
            if isSessionScene(previousScene) && sessionMuted {
                clearSessionAudio(stopForMute: true)
            }
        case "focusSession", "resetSession", "moveSession":
            pauseAmbient()
            if !sessionMuted && sessionPlaybackStoppedForMute {
                try engine.play()
                sessionPlaybackStoppedForMute = false
            }
        default:
            break
        }
    }

    func startSession(config: [String: Any], layers: [[String: Any]]) throws {
        let nextScene = config["scene"] as? String ?? "focusSession"
        let preset = config["preset"] as? String ?? "focusDefault"
        let modeLabel = config["modeLabel"] as? String ?? preset

        try initialize()
        try ensureSessionEngineInitialized()
        pauseAmbient()

        scene = nextScene
        activePreset = preset
        activeModeLabel = modeLabel
        sessionPlaybackStoppedForMute = false

        clearSessionAudio()

        if preset == "silent" || layers.isEmpty {
            print("[FlickerAudioCoordinator] Session uses external or silent audio: \(preset)")
            return
        }

        try engine.loadMode(mode: modeLabel, layers: layers)

        if nextScene == "resetSession" {
            engine.setMasterVolume(sessionMuted ? 0 : currentSessionTargetVolume(), fadeTime: 0)
            try engine.play()
            return
        }

        engine.setMasterVolume(sessionMuted ? 0 : masterVolume, fadeTime: 0)
        try engine.play()
    }

    func switchResetPreset(_ preset: String, layers: [[String: Any]]) throws {
        activePreset = preset
        activeModeLabel = "reset:\(preset)"
        try ensureSessionEngineInitialized()

        guard !layers.isEmpty else {
            clearSessionAudio()
            return
        }

        let targetVolume = sessionMuted ? 0 : currentSessionTargetVolume()

        sessionPlaybackStoppedForMute = false
        try engine.loadMode(mode: "reset:\(preset)", layers: layers)
        try engine.play()
        engine.setMasterVolume(targetVolume, fadeTime: 0)
    }

    func setSessionPhase(_ phase: String) {
        print("[FlickerAudioCoordinator] Session phase: \(phase)")
    }

    func endSession(reason: String) {
        print("[FlickerAudioCoordinator] Ending session: \(reason)")
        clearSessionAudio()
        activePreset = nil
        activeModeLabel = nil

        if scene == "shell" {
            resumeAmbientIfAllowed()
        }
    }

    func setMuted(_ muted: Bool) {
        setShellMuted(muted)
        setSessionMuted(muted)
    }

    func setShellMuted(_ muted: Bool) {
        shellMuted = muted
        ambientPlayer?.volume = muted ? 0 : ambientVolume

        if muted {
            pauseAmbient()
            return
        }

        if scene == "shell" {
            resumeAmbientIfAllowed()
        }
    }

    func setSessionMuted(_ muted: Bool) {
        sessionMuted = muted

        if muted {
            engine.setMasterVolume(0, fadeTime: 0)
            if scene == "backgrounded" {
                clearSessionAudio(stopForMute: true)
            }
            return
        }

        if isSessionScene(scene) && sessionPlaybackStoppedForMute {
            try? engine.play()
            sessionPlaybackStoppedForMute = false
        }

        engine.setMasterVolume(currentSessionTargetVolume(), fadeTime: 0)
    }

    func setMasterVolume(_ volume: Float, fadeTime: TimeInterval) {
        _ = fadeTime
        masterVolume = max(0, min(1, volume))
        if !sessionMuted {
            engine.setMasterVolume(currentSessionTargetVolume(), fadeTime: 0)
        }
    }

    func playOneShot(_ name: String) throws {
        guard !shellMuted else { return }
        guard scene == "shell" else { return }

        let filename: String
        switch name {
        case "shopOpen":
            filename = "shop_open.mp3"
        case "dialogueContinue":
            filename = "dialogue_continue_press.mp3"
        default:
            filename = "button_press.mp3"
        }

        let player = try prepareSfxPlayerIfNeeded(name: name, filename: filename)
        player.currentTime = 0
        player.play()
    }

    func getDebugState() -> [String: Any] {
        let ambientState: String
        if let ambientPlayer = ambientPlayer {
            ambientState = ambientPlayer.isPlaying ? "playing" : "paused"
        } else {
            ambientState = "stopped"
        }

        let engineState = engine.getState()
        let effectsState = engineState["effects"] as? [String: Any] ?? [:]
        let reverbState = effectsState["reverb"] as? [String: Any] ?? [:]
        let filterState = effectsState["filter"] as? [String: Any] ?? [:]
        let compressorState = effectsState["compressor"] as? [String: Any] ?? [:]
        let shellAudioActive = scene == "shell" && ambientState == "playing"
        let sessionAudioActive =
            activePreset != nil &&
            !sessionMuted &&
            (engineState["state"] as? String == "playing")

        return [
            "scene": scene,
            "activePreset": activePreset as Any,
            "appAmbientState": ambientState,
            "appAmbientPosition": ambientPlaybackPosition,
            "playbackState": engineState["state"] as? String ?? "stopped",
            "masterVolume": masterVolume,
            "shellMuted": shellMuted,
            "sessionMuted": sessionMuted,
            "activeMode": activeModeLabel as Any,
            "activeLayerCount": engineState["activeLayerCount"] as? Int ?? 0,
            "engineRunning": engineState["engineRunning"] as? Bool ?? false,
            "shellAudioActive": shellAudioActive && !sessionAudioActive,
            "sessionAudioActive": sessionAudioActive && !shellAudioActive,
            "effectsEnabled": [
                "reverb": reverbState["enabled"] as? Bool ?? false,
                "filter": filterState["enabled"] as? Bool ?? false,
                "compressor": compressorState["enabled"] as? Bool ?? false
            ],
        ]
    }

    private func clearSessionAudio() {
        clearSessionAudio(stopForMute: false)
    }

    private func clearSessionAudio(stopForMute: Bool) {
        engine.stop()
        sessionPlaybackStoppedForMute = stopForMute
        engine.setMasterVolume(sessionMuted ? 0 : currentSessionTargetVolume(), fadeTime: 0)
    }

    private func ensureSessionEngineInitialized() throws {
        try engine.initialize()
    }

    private func prepareAmbientPlayerIfNeeded() throws {
        if ambientPlayer != nil {
            return
        }

        let url: URL
        if let ambientAssetPath = ambientAssetPath, !ambientAssetPath.isEmpty {
            url = try AudioBufferManager.shared.resolveFileURL(filename: ambientAssetPath)
        } else {
            url = try AudioBufferManager.shared.resolveFileURL(filename: ambientTrackName)
        }
        let player = try AVAudioPlayer(contentsOf: url)
        player.numberOfLoops = -1
        player.volume = shellMuted ? 0 : ambientVolume
        player.prepareToPlay()
        ambientPlayer = player
    }

    private func prepareSfxPlayerIfNeeded(name: String, filename: String) throws -> AVAudioPlayer {
        if let cached = sfxPlayers[name] {
            return cached
        }

        let assetSource = uiSoundAssetPaths[name] ?? filename
        let url = try AudioBufferManager.shared.resolveFileURL(filename: assetSource)
        let player = try AVAudioPlayer(contentsOf: url)
        player.volume = 1
        player.prepareToPlay()
        sfxPlayers[name] = player
        return player
    }

    private func pauseAmbient() {
        guard let ambientPlayer = ambientPlayer else { return }
        guard ambientPlayer.isPlaying else { return }
        ambientPlaybackPosition = ambientPlayer.currentTime
        ambientPlayer.pause()
    }

    private func resumeAmbientIfAllowed() {
        guard !shellMuted else { return }

        do {
            try prepareAmbientPlayerIfNeeded()
        } catch {
            print("[FlickerAudioCoordinator] Failed to prepare ambient player: \(error)")
            return
        }

        guard let ambientPlayer = ambientPlayer else { return }
        ambientPlayer.volume = ambientVolume
        if ambientPlaybackPosition > 0, ambientPlaybackPosition < ambientPlayer.duration {
            ambientPlayer.currentTime = ambientPlaybackPosition
        }
        if !ambientPlayer.isPlaying {
            ambientPlayer.play()
        }
    }
}
