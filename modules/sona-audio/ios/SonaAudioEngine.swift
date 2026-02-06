//
//  SonaAudioEngine.swift
//  Sona
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

class SonaAudioEngine {
    // MARK: - Singleton

    static let shared = SonaAudioEngine()

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

    // Effects (Phase 4)
    private var effectsChain: EffectsChain?

    // MARK: - Initialization

    private init() {
        print("[SonaAudioEngine] Instance created")
    }

    func initialize() throws {
        guard !isInitialized else {
            print("[SonaAudioEngine] Already initialized")
            return
        }

        print("[SonaAudioEngine] Initializing...")

        // Configure audio session using AudioSessionManager
        do {
            try AudioSessionManager.shared.configure()

            // Setup interruption handlers
            AudioSessionManager.shared.onInterruptionBegan = { [weak self] in
                print("[SonaAudioEngine] Handling interruption - pausing")
                self?.pause()
            }

            AudioSessionManager.shared.onInterruptionEnded = { [weak self] in
                print("[SonaAudioEngine] Interruption ended - resuming")
                try? self?.play()
            }

            print("[SonaAudioEngine] Audio session configured successfully")
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

        // Setup effects chain (Phase 4)
        setupEffectsChain()

        // Set initial volume
        mainMixer?.outputVolume = masterVolume

        // Start the engine
        do {
            try engine.start()
            print("[SonaAudioEngine] AVAudioEngine started successfully")
        } catch {
            throw AudioEngineError.playbackError("Failed to start audio engine: \(error.localizedDescription)")
        }

        isInitialized = true
        print("[SonaAudioEngine] Initialization complete")
    }

    // MARK: - Setup Methods

    private func setupLegacyPlayer() {
        guard let engine = engine, let mainMixer = mainMixer else { return }

        legacyPlayerNode = AVAudioPlayerNode()
        guard let legacyPlayerNode = legacyPlayerNode else { return }

        let format = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 2)!

        engine.attach(legacyPlayerNode)
        engine.connect(legacyPlayerNode, to: mainMixer, format: format)

        print("[SonaAudioEngine] Legacy player setup complete")
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

        print("[SonaAudioEngine] Created \(layers.count) layers")
    }

    private func setupEffectsChain() {
        guard let engine = engine, let mainMixer = mainMixer else { return }

        // Create effects chain
        effectsChain = EffectsChain(engine: engine)

        // Connect: mainMixer → effects → output
        effectsChain?.connect(from: mainMixer, to: engine.outputNode)

        print("[SonaAudioEngine] Effects chain setup complete")
    }

    func dispose() {
        print("[SonaAudioEngine] Disposing...")

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

        print("[SonaAudioEngine] Disposed")
    }

    // MARK: - Playback Control

    func play() throws {
        guard isInitialized else {
            throw AudioEngineError.engineNotInitialized
        }

        if useMultiLayerMode {
            // Phase 2: Play all layers in sync
            print("[SonaAudioEngine] Playing all layers")
            if let renderTime = engine?.outputNode.lastRenderTime {
                let sampleRate = renderTime.sampleRate
                let startSampleTime = renderTime.sampleTime + AVAudioFramePosition(sampleRate * 0.05)
                let startTime = AVAudioTime(sampleTime: startSampleTime, atRate: sampleRate)
                for (_, layer) in layers {
                    layer.play(at: startTime)
                }
            } else {
                for (_, layer) in layers {
                    layer.play()
                }
            }
        } else {
            // Phase 1: Use legacy player
            guard let legacyPlayerNode = legacyPlayerNode else {
                throw AudioEngineError.engineNotInitialized
            }

            if let buffer = legacyBuffer {
                if state == .paused {
                    legacyPlayerNode.play()
                    state = .playing
                    print("[SonaAudioEngine] Resumed playback")
                } else {
                    legacyPlayerNode.stop()
                    legacyPlayerNode.scheduleBuffer(buffer, at: nil, options: .loops)
                    legacyPlayerNode.play()
                    state = .playing
                    print("[SonaAudioEngine] Started playback")
                }
            } else {
                print("[SonaAudioEngine] No buffer loaded, playing test tone")
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
        print("[SonaAudioEngine] Paused playback")
    }

    func stop() {
        if useMultiLayerMode {
            for (_, layer) in layers {
                layer.stop()
            }
        } else {
            legacyPlayerNode?.stop()
        }

        state = .stopped
        print("[SonaAudioEngine] Stopped playback")
    }

    // MARK: - Layer Management (Phase 2)

    /// Enable multi-layer mode and load test tones for all layers
    func enableMultiLayerMode() throws {
        guard isInitialized else {
            throw AudioEngineError.engineNotInitialized
        }

        print("[SonaAudioEngine] Enabling multi-layer mode with test tones")

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
        print("[SonaAudioEngine] Multi-layer mode enabled")
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

    // MARK: - Test Tone Generation (Phase 1)

    func playTestTone(frequency: Float, duration: TimeInterval) throws {
        guard isInitialized else {
            throw AudioEngineError.engineNotInitialized
        }

        print("[SonaAudioEngine] Generating test tone: \(frequency)Hz, \(duration)s")

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

        print("[SonaAudioEngine] Test tone playing")
    }

    // MARK: - Volume Control

    func setMasterVolume(_ volume: Float, fadeTime: TimeInterval) {
        guard let mainMixer = mainMixer else { return }

        let clampedVolume = max(0.0, min(1.0, volume))
        masterVolume = clampedVolume

        if fadeTime > 0 {
            // Smooth fade using timer
            let steps = 20
            let interval = fadeTime / Double(steps)
            let currentVolume = mainMixer.outputVolume
            let delta = (clampedVolume - currentVolume) / Float(steps)

            var currentStep = 0
            let timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { timer in
                guard currentStep < steps else {
                    mainMixer.outputVolume = clampedVolume
                    timer.invalidate()
                    return
                }

                mainMixer.outputVolume += delta
                currentStep += 1
            }

            RunLoop.main.add(timer, forMode: .common)
        } else {
            mainMixer.outputVolume = clampedVolume
        }

        print("[SonaAudioEngine] Master volume set to \(clampedVolume)")
    }

    func setLayerVolume(layer layerName: String, volume: Float, fadeTime: TimeInterval) {
        do {
            let layer = try getLayer(layerName)
            layer.setVolume(volume, fadeTime: fadeTime)
        } catch {
            print("[SonaAudioEngine] Error setting layer volume: \(error)")
        }
    }

    func setLayerMuted(layer layerName: String, muted: Bool) {
        do {
            let layer = try getLayer(layerName)
            layer.setMuted(muted)
        } catch {
            print("[SonaAudioEngine] Error muting layer: \(error)")
        }
    }

    // MARK: - Mode Loading (Phase 3)

    func loadMode(mode: String, layers layerConfigs: [[String: Any]]) throws {
        guard isInitialized else {
            throw AudioEngineError.engineNotInitialized
        }

        print("[SonaAudioEngine] Loading mode: \(mode)")

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
            print("[SonaAudioEngine] Using test tones")
            try enableMultiLayerMode()
            return
        }

        // Load real audio files
        print("[SonaAudioEngine] Loading real audio files...")

        for layerConfig in layerConfigs {
            guard let layerName = layerConfig["layer"] as? String,
                  let filename = layerConfig["filename"] as? String,
                  let volumeValue = layerConfig["volume"] as? Double else {
                print("[SonaAudioEngine] Skipping invalid layer config: \(layerConfig)")
                continue
            }

            let volume = Float(volumeValue)

            // Get the layer
            do {
                let layer = try getLayer(layerName)

                // Load audio file
                print("[SonaAudioEngine] Loading \(filename) for \(layerName) layer...")
                let buffer = try AudioBufferManager.shared.loadBuffer(fromFile: filename)

                // Load buffer into layer
                layer.loadBuffer(buffer)
                layer.setVolume(volume)

                print("[SonaAudioEngine] ✅ Loaded \(layerName): \(filename) at volume \(volume)")
            } catch {
                print("[SonaAudioEngine] ❌ Failed to load \(layerName): \(error)")
                // Continue with other layers even if one fails
            }
        }

        useMultiLayerMode = true
        print("[SonaAudioEngine] Mode loaded successfully: \(mode)")
    }

    /// Load a mode with real audio files asynchronously
    func loadModeAsync(mode: String, layers layerConfigs: [[String: Any]]) async throws {
        guard isInitialized else {
            throw AudioEngineError.engineNotInitialized
        }

        print("[SonaAudioEngine] Loading mode asynchronously: \(mode)")

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
                    print("[SonaAudioEngine] ✅ Loaded \(layerName): \(filename)")
                } catch {
                    print("[SonaAudioEngine] ❌ Failed to apply \(layerName): \(error)")
                }
            }
        }

        useMultiLayerMode = true
        print("[SonaAudioEngine] Mode loaded asynchronously: \(mode)")
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
            print("[SonaAudioEngine] Unknown effects preset: \(preset)")
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
            "layers": layerStates
        ]
    }

    // MARK: - Utility

    var isRunning: Bool {
        return engine?.isRunning ?? false
    }
}
