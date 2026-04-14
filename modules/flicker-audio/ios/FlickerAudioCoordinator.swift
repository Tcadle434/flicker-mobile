import AVFoundation
import Foundation

class FlickerAudioCoordinator {
    static let shared = FlickerAudioCoordinator()

    private let engine = FlickerAudioEngine.shared
    private let ambientTrackName = "main_app_background_music.m4a"
    private let ambientVolume: Float = 0.3
    private let resetSessionStartVolume: Float = 0.58
    private let resetSessionTargetVolume: Float = 0.72
    private let resetPresetTransitionVolumeFloor: Float = 0.35

    private var scene: String = "backgrounded"
    private var activePreset: String?
    private var activeModeLabel: String?
    private var ambientPlayer: AVAudioPlayer?
    private var ambientPlaybackPosition: TimeInterval = 0
    private var sfxPlayers: [String: AVAudioPlayer] = [:]
    private var ambientAssetPath: String?
    private var uiSoundAssetPaths: [String: String] = [:]
    private var isMuted = false
    private var masterVolume: Float = 0.8

    private init() {}

    func initialize() throws {
        try engine.initialize()
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
        scene = nextScene
        print("[FlickerAudioCoordinator] Entering scene: \(nextScene)")

        switch nextScene {
        case "shell":
            try engine.initialize()
            resumeAmbientIfAllowed()
        case "backgrounded":
            pauseAmbient()
        case "focusSession", "resetSession", "moveSession":
            pauseAmbient()
        default:
            break
        }
    }

    func startSession(config: [String: Any], layers: [[String: Any]]) throws {
        let nextScene = config["scene"] as? String ?? "focusSession"
        let preset = config["preset"] as? String ?? "focusDefault"
        let modeLabel = config["modeLabel"] as? String ?? preset

        try initialize()
        pauseAmbient()

        scene = nextScene
        activePreset = preset
        activeModeLabel = modeLabel

        clearSessionAudio()

        if preset == "silent" || preset == "spotify" || layers.isEmpty {
            print("[FlickerAudioCoordinator] Session uses external or silent audio: \(preset)")
            return
        }

        try engine.loadMode(mode: modeLabel, layers: layers)

        if nextScene == "resetSession" {
            engine.setMasterVolume(isMuted ? 0 : resetSessionStartVolume, fadeTime: 0)
            try engine.play()
            engine.setMasterVolume(
                isMuted ? 0 : min(masterVolume, resetSessionTargetVolume),
                fadeTime: 0.8
            )
            return
        }

        engine.setMasterVolume(isMuted ? 0 : masterVolume, fadeTime: 0)
        try engine.play()
    }

    func switchResetPreset(_ preset: String, layers: [[String: Any]]) throws {
        activePreset = preset
        activeModeLabel = "reset:\(preset)"

        guard !layers.isEmpty else {
            clearSessionAudio()
            return
        }

        let targetVolume = isMuted ? 0 : max(masterVolume, resetSessionTargetVolume)
        let transitionFloor = isMuted ? 0 : max(resetPresetTransitionVolumeFloor, targetVolume * 0.65)

        engine.setMasterVolume(transitionFloor, fadeTime: 0.12)
        try engine.loadMode(mode: "reset:\(preset)", layers: layers)
        try engine.play()
        engine.setMasterVolume(targetVolume, fadeTime: 0.18)
    }

    func applyResetCustomConfig(_ config: [String: Any], layers: [[String: Any]]) throws {
        print("[FlickerAudioCoordinator] Applying reset custom config: \(config)")
        try switchResetPreset("resetCustom", layers: layers)
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
        isMuted = muted
        ambientPlayer?.volume = muted ? 0 : ambientVolume

        if muted {
            engine.setMasterVolume(0, fadeTime: 0.1)
            pauseAmbient()
            return
        }

        engine.setMasterVolume(masterVolume, fadeTime: 0.1)
        if scene == "shell" {
            resumeAmbientIfAllowed()
        }
    }

    func setMasterVolume(_ volume: Float, fadeTime: TimeInterval) {
        masterVolume = max(0, min(1, volume))
        if !isMuted {
            engine.setMasterVolume(masterVolume, fadeTime: fadeTime)
        }
    }

    func playOneShot(_ name: String) throws {
        guard !isMuted else { return }
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
        return [
            "scene": scene,
            "activePreset": activePreset as Any,
            "appAmbientState": ambientState,
            "appAmbientPosition": ambientPlaybackPosition,
            "playbackState": engineState["state"] as? String ?? "stopped",
            "masterVolume": masterVolume,
            "isMuted": isMuted,
            "activeMode": activeModeLabel as Any,
        ]
    }

    private func clearSessionAudio() {
        engine.stop()
        engine.setMasterVolume(isMuted ? 0 : masterVolume, fadeTime: 0)
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
        player.volume = isMuted ? 0 : ambientVolume
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
        guard !isMuted else { return }

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
