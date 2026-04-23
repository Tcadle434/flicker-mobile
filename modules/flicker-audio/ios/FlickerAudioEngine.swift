//
//  FlickerAudioEngine.swift
//  Flicker
//
//  Created by Claude Code
//  Core AVAudioEngine manager for multi-layer audio playback
//

import AVFoundation
import Foundation

// MARK: - Audio Engine Errors

enum AudioEngineError: Error {
    case engineNotInitialized
    case audioSessionError(String)
    case playbackError(String)
    case invalidParameter(String)
    case layerNotFound(String)
}

// MARK: - Playback State

enum PlaybackState: String {
    case stopped
    case playing
    case paused
}

// MARK: - Main Audio Engine

class FlickerAudioEngine {
    // MARK: - Singleton

    static let shared = FlickerAudioEngine()

    // MARK: - Properties

    private var engine: AVAudioEngine?
    private var mainMixer: AVAudioMixerNode?

    // 5 Layer players
    private var layers: [LayerType: AudioLayerPlayer] = [:]

    // Single player node for Phase 1 testing (legacy)
    private var legacyPlayerNode: AVAudioPlayerNode?
    private var legacyBuffer: AVAudioPCMBuffer?

    private var state: PlaybackState = .stopped
    private var masterVolume: Float = 1.0
    private var isInitialized = false
    private var useMultiLayerMode = false // Toggle between Phase 1 and Phase 2 modes
    private var currentModeName: String?
    private var currentActiveLayerTypes: Set<LayerType> = []

    // Effects (Phase 4 compatibility only; disabled for the live single-track path)
    private var effectsChain: EffectsChain?

    // MARK: - Initialization

    private init() {
        print("[FlickerAudioEngine] Instance created")
    }

    func initialize() throws {
        guard !isInitialized else {
            print("[FlickerAudioEngine] Already initialized")
            return
        }

        print("[FlickerAudioEngine] Initializing...")

        // Configure audio session using AudioSessionManager
        do {
            try AudioSessionManager.shared.configure()

            // Setup interruption handlers
            AudioSessionManager.shared.onInterruptionBegan = { [weak self] in
                print("[FlickerAudioEngine] Handling interruption - pausing")
                self?.pause()
            }

            AudioSessionManager.shared.onInterruptionEnded = { [weak self] in
                print("[FlickerAudioEngine] Interruption ended - resuming")
                try? self?.play()
            }

            print("[FlickerAudioEngine] Audio session configured successfully")
        } catch {
            throw AudioEngineError.audioSessionError("Failed to configure audio session: \(error.localizedDescription)")
        }

        // Setup audio engine
        engine = AVAudioEngine()
        guard let engine = engine else {
            throw AudioEngineError.engineNotInitialized
        }

        // Get the main mixer
        mainMixer = engine.mainMixerNode

        // Setup legacy single player (Phase 1)
        setupLegacyPlayer()

        // Setup 5 layers (Phase 2)
        setupLayers()

        effectsChain = nil

        // Set initial volume
        mainMixer?.outputVolume = masterVolume

        // Start the engine
        do {
            try engine.start()
            print("[FlickerAudioEngine] AVAudioEngine started successfully")
        } catch {
            throw AudioEngineError.playbackError("Failed to start audio engine: \(error.localizedDescription)")
        }

        isInitialized = true
        print("[FlickerAudioEngine] Initialization complete")
    }

    // MARK: - Setup Methods

    private func setupLegacyPlayer() {
        guard let engine = engine, let mainMixer = mainMixer else { return }

        legacyPlayerNode = AVAudioPlayerNode()
        guard let legacyPlayerNode = legacyPlayerNode else { return }

        let format = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 2)!

        engine.attach(legacyPlayerNode)
        engine.connect(legacyPlayerNode, to: mainMixer, format: format)

        print("[FlickerAudioEngine] Legacy player setup complete")
    }

    private func setupLayers() {
        guard let engine = engine, let mainMixer = mainMixer else { return }

        // Create 5 layer players
        let layerTypes: [LayerType] = [.ambient, .nature, .melody, .rhythm, .binaural]

        for layerType in layerTypes {
            let layer = AudioLayerPlayer(layerType: layerType, engine: engine)
            layer.connect(to: mainMixer)
            layers[layerType] = layer
        }

        print("[FlickerAudioEngine] Created \(layers.count) layers")
    }

    private func setupEffectsChain() {
        guard let engine = engine, let mainMixer = mainMixer else { return }

        // Create effects chain
        effectsChain = EffectsChain(engine: engine)

        // Connect: mainMixer → effects → output
        effectsChain?.connect(from: mainMixer, to: engine.outputNode)

        print("[FlickerAudioEngine] Effects chain setup complete")
    }

    func dispose() {
        print("[FlickerAudioEngine] Disposing...")

        // Stop playback
        stop()

        // Stop all layers
        for (_, layer) in layers {
            layer.stop()
        }

        // Stop the engine
        engine?.stop()

        // Clean up
        legacyPlayerNode = nil
        legacyBuffer = nil
        mainMixer = nil
        engine = nil
        layers.removeAll()

        isInitialized = false
        state = .stopped
        currentModeName = nil
        currentActiveLayerTypes = []

        print("[FlickerAudioEngine] Disposed")
    }

    // MARK: - Playback Control

    func play() throws {
        guard isInitialized else {
            throw AudioEngineError.engineNotInitialized
        }

        // Re-activate the audio session in case another audio system
        // (e.g. expo-audio background music) deactivated it.
        try AudioSessionManager.shared.configure()

        // Restart the engine if it was stopped by a session deactivation
        if let engine = engine, !engine.isRunning {
            print("[FlickerAudioEngine] Engine was stopped — restarting")
            try engine.start()
        }

        if useMultiLayerMode {
            // Phase 2: Play all layers in sync
            print("[FlickerAudioEngine] Playing all layers")
            scheduleActiveLayers(currentActiveLayerTypes)
        } else {
            // Phase 1: Use legacy player
            guard let legacyPlayerNode = legacyPlayerNode else {
                throw AudioEngineError.engineNotInitialized
            }

            if let buffer = legacyBuffer {
                if state == .paused {
                    legacyPlayerNode.play()
                    state = .playing
                    print("[FlickerAudioEngine] Resumed playback")
                } else {
                    legacyPlayerNode.stop()
                    legacyPlayerNode.scheduleBuffer(buffer, at: nil, options: .loops)
                    legacyPlayerNode.play()
                    state = .playing
                    print("[FlickerAudioEngine] Started playback")
                }
            } else {
                print("[FlickerAudioEngine] No buffer loaded, playing test tone")
                try playTestTone(frequency: 440, duration: 10.0)
            }
        }

        state = .playing
    }

    func pause() {
        if useMultiLayerMode {
            for (_, layer) in layers {
                layer.pause()
            }
        } else {
            legacyPlayerNode?.pause()
        }

        state = .paused
        print("[FlickerAudioEngine] Paused playback")
    }

    func stop() {
        if useMultiLayerMode {
            for (_, layer) in layers {
                layer.stop()
            }
        } else {
            legacyPlayerNode?.stop()
        }

        engine?.stop()
        state = .stopped
        print("[FlickerAudioEngine] Stopped playback")
    }

    // MARK: - Layer Management (Phase 2)

    /// Enable multi-layer mode and load test tones for all layers
    func enableMultiLayerMode() throws {
        guard isInitialized else {
            throw AudioEngineError.engineNotInitialized
        }

        print("[FlickerAudioEngine] Enabling multi-layer mode with test tones")

        // Generate test tones for each layer
        let ambientBuffer = TestToneGenerator.generateTestTone(type: .ambient, duration: 8.0, volume: 0.5)
        let natureBuffer = TestToneGenerator.generateTestTone(type: .nature, duration: 8.0, volume: 0.4)
        let melodyBuffer = TestToneGenerator.generateTestTone(type: .melody, duration: 8.0, volume: 0.5)
        let rhythmBuffer = TestToneGenerator.generateTestTone(type: .rhythm, duration: 8.0, volume: 0.4)
        let binauralBuffer = TestToneGenerator.generateTestTone(type: .binaural, duration: 8.0, volume: 0.4)

        // Load buffers into layers
        layers[.ambient]?.loadBuffer(ambientBuffer)
        layers[.nature]?.loadBuffer(natureBuffer)
        layers[.melody]?.loadBuffer(melodyBuffer)
        layers[.rhythm]?.loadBuffer(rhythmBuffer)
        layers[.binaural]?.loadBuffer(binauralBuffer)

        // Set initial volumes
        layers[.ambient]?.setVolume(0.7)
        layers[.nature]?.setVolume(0.5)
        layers[.melody]?.setVolume(0.6)
        layers[.rhythm]?.setVolume(0.4)
        layers[.binaural]?.setVolume(0.3)

        useMultiLayerMode = true
        currentModeName = "test"
        currentActiveLayerTypes = Set([.ambient, .nature, .melody, .rhythm, .binaural])
        print("[FlickerAudioEngine] Multi-layer mode enabled")
    }

    /// Get a specific layer
    private func getLayer(_ layerName: String) throws -> AudioLayerPlayer {
        guard let layerType = LayerType(rawValue: layerName.lowercased()) else {
            throw AudioEngineError.invalidParameter("Invalid layer name: \(layerName)")
        }

        guard let layer = layers[layerType] else {
            throw AudioEngineError.layerNotFound("Layer not found: \(layerName)")
        }

        return layer
    }

    private func scheduleActiveLayers(_ activeLayers: Set<LayerType>) {
        guard !activeLayers.isEmpty else { return }

        // One-layer modes do not benefit from synchronized future scheduling,
        // and immediate starts are more reliable for long streamed assets such
        // as the reset session's standalone 432Hz track.
        if activeLayers.count == 1 {
            for layerType in activeLayers {
                layers[layerType]?.play()
            }
            return
        }

        if let renderTime = engine?.outputNode.lastRenderTime {
            let sampleRate = renderTime.sampleRate
            let startSampleTime = renderTime.sampleTime + AVAudioFramePosition(sampleRate * 0.05)
            let startTime = AVAudioTime(sampleTime: startSampleTime, atRate: sampleRate)

            for layerType in activeLayers {
                layers[layerType]?.play(at: startTime)
            }
        } else {
            for layerType in activeLayers {
                layers[layerType]?.play()
            }
        }
    }

    private func shouldPreferStreamingStandaloneMode(mode: String, activeLayers: Set<LayerType>) -> Bool {
        return mode.hasPrefix("reset:") && activeLayers.count == 1
    }

    // MARK: - Test Tone Generation (Phase 1)

    func playTestTone(frequency: Float, duration: TimeInterval) throws {
        guard isInitialized else {
            throw AudioEngineError.engineNotInitialized
        }

        print("[FlickerAudioEngine] Generating test tone: \(frequency)Hz, \(duration)s")

        // Generate the test tone buffer
        let buffer = TestToneGenerator.generateSineWave(
            frequency: frequency,
            duration: duration,
            volume: 0.5
        )

        // Store the buffer
        legacyBuffer = buffer

        // Schedule and play
        guard let legacyPlayerNode = legacyPlayerNode else {
            throw AudioEngineError.engineNotInitialized
        }

        legacyPlayerNode.stop()
        legacyPlayerNode.scheduleBuffer(buffer, at: nil, options: .loops)
        legacyPlayerNode.play()
        state = .playing

        print("[FlickerAudioEngine] Test tone playing")
    }

    // MARK: - Volume Control

    func setMasterVolume(_ volume: Float, fadeTime: TimeInterval) {
        _ = fadeTime
        guard let mainMixer = mainMixer else { return }

        let clampedVolume = max(0.0, min(1.0, volume))
        masterVolume = clampedVolume
        mainMixer.outputVolume = clampedVolume

        print("[FlickerAudioEngine] Master volume set to \(clampedVolume)")
    }

    func setLayerVolume(layer layerName: String, volume: Float, fadeTime: TimeInterval) {
        do {
            let layer = try getLayer(layerName)
            layer.setVolume(volume, fadeTime: fadeTime)
        } catch {
            print("[FlickerAudioEngine] Error setting layer volume: \(error)")
        }
    }

    func setLayerMuted(layer layerName: String, muted: Bool) {
        do {
            let layer = try getLayer(layerName)
            layer.setMuted(muted)
        } catch {
            print("[FlickerAudioEngine] Error muting layer: \(error)")
        }
    }

    func setLayerLoop(
        layer layerName: String,
        loopId: String,
        filename: String,
        volume: Float,
        fadeTime: TimeInterval
    ) throws {
        let layer = try getLayer(layerName)
        let layerType = LayerType(rawValue: layerName.lowercased())
        let preferStreaming =
            currentModeName.map { $0.hasPrefix("reset:") } == true &&
            currentActiveLayerTypes.count == 1 &&
            layerType.map { currentActiveLayerTypes.contains($0) } == true
        let playbackAsset = try AudioBufferManager.shared.loadPlaybackAsset(
            fromFile: filename,
            preferStreaming: preferStreaming
        )

        switch playbackAsset {
        case .buffer(let buffer):
            if state == .playing {
                layer.replaceBuffer(buffer, restartPlayback: true)
            } else {
                layer.replaceBuffer(buffer, restartPlayback: false)
            }
        case .streamedFile(let fileURL):
            if state == .playing {
                layer.replaceFile(fileURL, restartPlayback: true)
            } else {
                layer.replaceFile(fileURL, restartPlayback: false)
            }
        }

        layer.setVolume(volume)
        print("[FlickerAudioEngine] Set loop for \(layerName): \(loopId) (\(filename))")
    }

    // MARK: - Mode Loading (Phase 3)

    func loadMode(mode: String, layers layerConfigs: [[String: Any]]) throws {
        guard isInitialized else {
            throw AudioEngineError.engineNotInitialized
        }

        print("[FlickerAudioEngine] Loading mode: \(mode)")

        let activeLayerTypes = Set(
            layerConfigs.compactMap { layerConfig -> LayerType? in
                guard let layerName = layerConfig["layer"] as? String else {
                    return nil
                }

                return LayerType(rawValue: layerName.lowercased())
            }
        )

        // Check if we should use real audio files or test tones
        var useRealAudio = false

        for layerConfig in layerConfigs {
            if let filename = layerConfig["filename"] as? String,
               !filename.isEmpty && filename != "test.wav" {
                useRealAudio = true
                break
            }
        }

        if !useRealAudio {
            // No real audio files specified, use test tones
            print("[FlickerAudioEngine] Using test tones")
            try enableMultiLayerMode()
            return
        }

        let preferStreamingStandaloneMode = shouldPreferStreamingStandaloneMode(
            mode: mode,
            activeLayers: activeLayerTypes
        )

        for (layerType, layer) in layers {
            if !activeLayerTypes.contains(layerType) {
                layer.deactivate()
            }
        }

        // Load real audio files
        print("[FlickerAudioEngine] Loading real audio files...")
        var loadedLayerCount = 0

        for layerConfig in layerConfigs {
            guard let layerName = layerConfig["layer"] as? String,
                  let filename = layerConfig["filename"] as? String,
                  let volumeValue = layerConfig["volume"] as? Double else {
                print("[FlickerAudioEngine] Skipping invalid layer config: \(layerConfig)")
                continue
            }

            let volume = Float(volumeValue)

            // Get the layer
            do {
                let layer = try getLayer(layerName)
                let layerType = LayerType(rawValue: layerName.lowercased())
                let preferStreaming =
                    preferStreamingStandaloneMode &&
                    layerType.map { activeLayerTypes.contains($0) } == true

                // Load audio file
                print("[FlickerAudioEngine] Loading \(filename) for \(layerName) layer...")
                let playbackAsset = try AudioBufferManager.shared.loadPlaybackAsset(
                    fromFile: filename,
                    preferStreaming: preferStreaming
                )

                switch playbackAsset {
                case .buffer(let buffer):
                    layer.loadBuffer(buffer)
                case .streamedFile(let fileURL):
                    layer.loadFile(fileURL)
                }

                layer.setVolume(volume)
                loadedLayerCount += 1

                print("[FlickerAudioEngine] ✅ Loaded \(layerName): \(filename) at volume \(volume)")
            } catch {
                print("[FlickerAudioEngine] ❌ Failed to load \(layerName): \(error)")
                if let layerName = layerConfig["layer"] as? String,
                   let layerType = LayerType(rawValue: layerName.lowercased()) {
                    layers[layerType]?.deactivate()
                }
                // Continue with other layers even if one fails
            }
        }

        if loadedLayerCount == 0 {
            throw AudioEngineError.playbackError("No audio layers were loaded for mode '\(mode)'.")
        }

        useMultiLayerMode = true
        currentModeName = mode
        currentActiveLayerTypes = activeLayerTypes

        if state == .playing {
            scheduleActiveLayers(activeLayerTypes)
        }

        print("[FlickerAudioEngine] Mode loaded successfully: \(mode) with \(loadedLayerCount) layers")
    }

    /// Load a mode with real audio files asynchronously
    func loadModeAsync(mode: String, layers layerConfigs: [[String: Any]]) async throws {
        guard isInitialized else {
            throw AudioEngineError.engineNotInitialized
        }

        print("[FlickerAudioEngine] Loading mode asynchronously: \(mode)")

        // Extract filenames
        var filenames: [String] = []
        for layerConfig in layerConfigs {
            if let filename = layerConfig["filename"] as? String,
               !filename.isEmpty && filename != "test.wav" {
                filenames.append(filename)
            }
        }

        if filenames.isEmpty {
            // No real files, use test tones
            try enableMultiLayerMode()
            return
        }

        // Load all files concurrently
        let buffers = try await AudioBufferManager.shared.loadBuffers(fromFiles: filenames)

        // Apply buffers to layers
        for layerConfig in layerConfigs {
            guard let layerName = layerConfig["layer"] as? String,
                  let filename = layerConfig["filename"] as? String,
                  let volumeValue = layerConfig["volume"] as? Double else {
                continue
            }

            let volume = Float(volumeValue)

            if let buffer = buffers[filename] {
                do {
                    let layer = try getLayer(layerName)
                    layer.loadBuffer(buffer)
                    layer.setVolume(volume)
                    print("[FlickerAudioEngine] ✅ Loaded \(layerName): \(filename)")
                } catch {
                    print("[FlickerAudioEngine] ❌ Failed to apply \(layerName): \(error)")
                }
            }
        }

        useMultiLayerMode = true
        print("[FlickerAudioEngine] Mode loaded asynchronously: \(mode)")
    }

    // MARK: - Effects Control (Phase 4)

    func setReverbEnabled(_ enabled: Bool) {
        effectsChain?.setReverbEnabled(enabled)
    }

    func setReverbWetDryMix(_ mix: Float) {
        effectsChain?.setReverbWetDryMix(mix)
    }

    func setReverbRoomSize(_ size: Float) {
        effectsChain?.setReverbRoomSize(size)
    }

    func setFilterEnabled(_ enabled: Bool) {
        effectsChain?.setFilterEnabled(enabled)
    }

    func setFilterCutoff(_ frequency: Float) {
        effectsChain?.setFilterCutoff(frequency)
    }

    func setCompressorEnabled(_ enabled: Bool) {
        effectsChain?.setCompressorEnabled(enabled)
    }

    func setCompressorWetDryMix(_ mix: Float) {
        effectsChain?.setCompressorWetDryMix(mix)
    }

    func applyEffectsPreset(_ preset: String) {
        guard let effectsChain = effectsChain else { return }

        switch preset.lowercased() {
        case "off":
            effectsChain.applyPreset(.off)
        case "subtle":
            effectsChain.applyPreset(.subtle)
        case "moderate":
            effectsChain.applyPreset(.moderate)
        case "heavy":
            effectsChain.applyPreset(.heavy)
        default:
            print("[FlickerAudioEngine] Unknown effects preset: \(preset)")
        }
    }

    // MARK: - State Query

    func getState() -> [String: Any] {
        var layerStates: [[String: Any]] = []

        for (layerType, layer) in layers {
            layerStates.append([
                "layer": layerType.rawValue,
                "volume": layer.currentVolume,
                "playing": layer.playing,
                "muted": layer.muted
            ])
        }

        return [
            "state": state.rawValue,
            "masterVolume": masterVolume,
            "isInitialized": isInitialized,
            "multiLayerMode": useMultiLayerMode,
            "layers": layerStates,
            "activeLayerCount": currentActiveLayerTypes.count,
            "activeLayers": currentActiveLayerTypes.map { $0.rawValue }.sorted(),
            "currentMode": currentModeName as Any,
            "engineRunning": isRunning,
            "effects": effectsChain?.getState() ?? [:]
        ]
    }

    // MARK: - Utility

    var isRunning: Bool {
        return engine?.isRunning ?? false
    }
}
