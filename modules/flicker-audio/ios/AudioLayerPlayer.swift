//
//  AudioLayerPlayer.swift
//  Flicker
//
//  Created by Claude Code
//  Single audio layer with dual player nodes for seamless crossfading
//

import AVFoundation
import Foundation

// MARK: - Layer Type

enum LayerType: String {
    case ambient
    case nature
    case melody
    case rhythm
    case binaural
}

// MARK: - Audio Layer Player

class AudioLayerPlayer {
    // MARK: - Properties

    let layerType: LayerType
    private let engine: AVAudioEngine

    // Dual player nodes for crossfading
    private var playerNodeA: AVAudioPlayerNode
    private var playerNodeB: AVAudioPlayerNode
    private var currentPlayer: AVAudioPlayerNode // Which player is active
    private var isUsingPlayerA = true

    // Gain nodes for volume control
    private var gainNodeA: AVAudioMixerNode
    private var gainNodeB: AVAudioMixerNode
    private var masterGainNode: AVAudioMixerNode

    // State
    private var currentBuffer: AVAudioPCMBuffer?
    private var nextBuffer: AVAudioPCMBuffer?
    private var isPlaying = false
    private var isMuted = false
    private var volume: Float = 1.0

    // Audio format (48kHz stereo)
    private let format = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 2)!

    // MARK: - Initialization

    init(layerType: LayerType, engine: AVAudioEngine) {
        self.layerType = layerType
        self.engine = engine

        // Create player nodes
        playerNodeA = AVAudioPlayerNode()
        playerNodeB = AVAudioPlayerNode()
        currentPlayer = playerNodeA

        // Create gain nodes for volume control
        gainNodeA = AVAudioMixerNode()
        gainNodeB = AVAudioMixerNode()
        masterGainNode = AVAudioMixerNode()

        // Attach nodes to engine
        engine.attach(playerNodeA)
        engine.attach(playerNodeB)
        engine.attach(gainNodeA)
        engine.attach(gainNodeB)
        engine.attach(masterGainNode)

        // Connect: playerA → gainA → masterGain
        engine.connect(playerNodeA, to: gainNodeA, format: format)
        // Connect: playerB → gainB → masterGain
        engine.connect(playerNodeB, to: gainNodeB, format: format)
        // Connect: gainA → masterGain
        engine.connect(gainNodeA, to: masterGainNode, format: format)
        // Connect: gainB → masterGain
        engine.connect(gainNodeB, to: masterGainNode, format: format)

        // Set initial volumes
        gainNodeA.outputVolume = 1.0
        gainNodeB.outputVolume = 0.0 // Start with B silent
        masterGainNode.outputVolume = volume

        print("[AudioLayerPlayer] Initialized layer: \(layerType.rawValue)")
    }

    // MARK: - Connection

    /// Connect this layer's output to a destination node
    func connect(to destination: AVAudioNode) {
        engine.connect(masterGainNode, to: destination, format: format)
        print("[AudioLayerPlayer] Connected \(layerType.rawValue) to destination")
    }

    // MARK: - Buffer Management

    /// Load a buffer for this layer
    func loadBuffer(_ buffer: AVAudioPCMBuffer) {
        currentBuffer = buffer
        print("[AudioLayerPlayer] Loaded buffer for \(layerType.rawValue): \(buffer.frameLength) frames")
    }

    /// Prepare a buffer for crossfading
    func prepareNextBuffer(_ buffer: AVAudioPCMBuffer) {
        nextBuffer = buffer
        print("[AudioLayerPlayer] Prepared next buffer for \(layerType.rawValue)")
    }

    // MARK: - Playback Control

    /// Start playing the current buffer
    func play(at time: AVAudioTime? = nil) {
        guard let buffer = currentBuffer else {
            print("[AudioLayerPlayer] No buffer loaded for \(layerType.rawValue)")
            return
        }

        // Make sure the current player is audible
        if isUsingPlayerA {
            gainNodeA.outputVolume = 1.0
            gainNodeB.outputVolume = 0.0
        } else {
            gainNodeA.outputVolume = 0.0
            gainNodeB.outputVolume = 1.0
        }

        // Schedule buffer with looping
        currentPlayer.stop()
        currentPlayer.scheduleBuffer(buffer, at: nil, options: .loops)

        if let time = time {
            currentPlayer.play(at: time)
        } else {
            currentPlayer.play()
        }

        isPlaying = true
        print("[AudioLayerPlayer] Playing \(layerType.rawValue)")
    }

    /// Pause playback
    func pause() {
        playerNodeA.pause()
        playerNodeB.pause()
        isPlaying = false
        print("[AudioLayerPlayer] Paused \(layerType.rawValue)")
    }

    /// Stop playback
    func stop() {
        playerNodeA.stop()
        playerNodeB.stop()
        isPlaying = false
        print("[AudioLayerPlayer] Stopped \(layerType.rawValue)")
    }

    // MARK: - Crossfading

    /// Crossfade to a new buffer
    /// - Parameters:
    ///   - newBuffer: The buffer to crossfade to
    ///   - duration: Crossfade duration in seconds (default: 4.0)
    func crossfadeTo(buffer newBuffer: AVAudioPCMBuffer, duration: TimeInterval = 4.0) {
        guard isPlaying else {
            // If not playing, just load the new buffer
            loadBuffer(newBuffer)
            return
        }

        print("[AudioLayerPlayer] Crossfading \(layerType.rawValue) over \(duration)s")

        // Determine which player to fade in/out
        let fadeOutPlayer: AVAudioPlayerNode
        let fadeInPlayer: AVAudioPlayerNode
        let fadeOutGain: AVAudioMixerNode
        let fadeInGain: AVAudioMixerNode

        if isUsingPlayerA {
            fadeOutPlayer = playerNodeA
            fadeInPlayer = playerNodeB
            fadeOutGain = gainNodeA
            fadeInGain = gainNodeB
        } else {
            fadeOutPlayer = playerNodeB
            fadeInPlayer = playerNodeA
            fadeOutGain = gainNodeB
            fadeInGain = gainNodeA
        }

        // Schedule new buffer on fade-in player
        fadeInPlayer.stop()
        fadeInPlayer.scheduleBuffer(newBuffer, at: nil, options: .loops)

        // Start fade-in player at same position (approximately)
        fadeInPlayer.play()

        // Generate equal-power crossfade curves
        let (fadeOutCurve, fadeInCurve) = CrossfadeManager.generateEqualPowerCurves(duration: duration)

        // Apply crossfade using timer (AVAudioMixerNode doesn't support parameter automation)
        let steps = fadeOutCurve.count
        let interval = duration / Double(steps)
        var currentStep = 0

        let timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { timer in
            guard currentStep < steps else {
                // Crossfade complete
                fadeOutPlayer.stop()
                fadeOutGain.outputVolume = 0.0
                fadeInGain.outputVolume = 1.0

                // Update current player reference
                self.currentPlayer = fadeInPlayer
                self.isUsingPlayerA = !self.isUsingPlayerA
                self.currentBuffer = newBuffer

                print("[AudioLayerPlayer] Crossfade complete for \(self.layerType.rawValue)")
                timer.invalidate()
                return
            }

            // Apply crossfade curves
            fadeOutGain.outputVolume = fadeOutCurve[currentStep]
            fadeInGain.outputVolume = fadeInCurve[currentStep]

            currentStep += 1
        }

        // Add timer to run loop
        RunLoop.main.add(timer, forMode: .common)
    }

    // MARK: - Volume Control

    /// Set layer volume with optional fade
    /// - Parameters:
    ///   - volume: Volume level (0-1)
    ///   - fadeTime: Fade duration in seconds (default: 0)
    func setVolume(_ volume: Float, fadeTime: TimeInterval = 0) {
        let clampedVolume = max(0.0, min(1.0, volume))
        self.volume = clampedVolume

        if isMuted {
            // If muted, store the volume but don't apply
            return
        }

        if fadeTime > 0 {
            // Smooth fade using timer
            let steps = 20
            let interval = fadeTime / Double(steps)
            let currentVolume = masterGainNode.outputVolume
            let delta = (clampedVolume - currentVolume) / Float(steps)

            var currentStep = 0
            let timer = Timer.scheduledTimer(withTimeInterval: interval, repeats: true) { timer in
                guard currentStep < steps else {
                    self.masterGainNode.outputVolume = clampedVolume
                    timer.invalidate()
                    return
                }

                self.masterGainNode.outputVolume += delta
                currentStep += 1
            }

            RunLoop.main.add(timer, forMode: .common)
        } else {
            // Instant change
            masterGainNode.outputVolume = clampedVolume
        }

        print("[AudioLayerPlayer] Set volume for \(layerType.rawValue): \(clampedVolume)")
    }

    /// Mute or unmute the layer
    /// - Parameter muted: True to mute, false to unmute
    func setMuted(_ muted: Bool) {
        isMuted = muted

        if muted {
            masterGainNode.outputVolume = 0.0
            print("[AudioLayerPlayer] Muted \(layerType.rawValue)")
        } else {
            masterGainNode.outputVolume = volume
            print("[AudioLayerPlayer] Unmuted \(layerType.rawValue)")
        }
    }

    // MARK: - State Query

    var currentVolume: Float {
        return masterGainNode.outputVolume
    }

    var playing: Bool {
        return isPlaying
    }

    var muted: Bool {
        return isMuted
    }
}
