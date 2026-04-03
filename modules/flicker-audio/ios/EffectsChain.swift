//
//  EffectsChain.swift
//  Flicker
//
//  Created by Claude Code
//  Audio effects chain management (reverb, filter, compression)
//

import AVFoundation
import Foundation

// MARK: - Effects Chain

class EffectsChain {
    // MARK: - Properties

    private let engine: AVAudioEngine

    // Effect nodes
    private var reverbNode: AVAudioUnitReverb
    private var eqNode: AVAudioUnitEQ
    private var distortionNode: AVAudioUnitDistortion // Used for compression effect

    // Effect bypass states
    private var reverbEnabled = false
    private var filterEnabled = false
    private var compressorEnabled = false

    // Audio format
    private let format = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 2)!

    // MARK: - Initialization

    init(engine: AVAudioEngine) {
        self.engine = engine

        // Create effect nodes
        reverbNode = AVAudioUnitReverb()
        eqNode = AVAudioUnitEQ(numberOfBands: 10)
        distortionNode = AVAudioUnitDistortion()

        // Attach nodes to engine
        engine.attach(reverbNode)
        engine.attach(eqNode)
        engine.attach(distortionNode)

        // Configure initial settings
        setupReverb()
        setupEQ()
        setupCompressor()

        print("[EffectsChain] Initialized")
    }

    // MARK: - Setup Methods

    private func setupReverb() {
        // Start with a medium room preset
        reverbNode.loadFactoryPreset(.mediumRoom)

        // Default settings
        reverbNode.wetDryMix = 0.0 // Start dry (0%)

        // Bypass by default
        reverbNode.bypass = true

        print("[EffectsChain] Reverb configured")
    }

    private func setupEQ() {
        // Configure EQ bands for filtering
        // Band 0: Low shelf (for bass control)
        eqNode.bands[0].filterType = .lowShelf
        eqNode.bands[0].frequency = 100
        eqNode.bands[0].gain = 0
        eqNode.bands[0].bypass = false

        // Band 1: Low-mid peak
        eqNode.bands[1].filterType = .parametric
        eqNode.bands[1].frequency = 250
        eqNode.bands[1].bandwidth = 1.0
        eqNode.bands[1].gain = 0
        eqNode.bands[1].bypass = false

        // Band 2: Mid peak
        eqNode.bands[2].filterType = .parametric
        eqNode.bands[2].frequency = 500
        eqNode.bands[2].bandwidth = 1.0
        eqNode.bands[2].gain = 0
        eqNode.bands[2].bypass = false

        // Band 3: Upper-mid peak
        eqNode.bands[3].filterType = .parametric
        eqNode.bands[3].frequency = 1000
        eqNode.bands[3].bandwidth = 1.0
        eqNode.bands[3].gain = 0
        eqNode.bands[3].bypass = false

        // Band 4: Presence peak
        eqNode.bands[4].filterType = .parametric
        eqNode.bands[4].frequency = 2000
        eqNode.bands[4].bandwidth = 1.0
        eqNode.bands[4].gain = 0
        eqNode.bands[4].bypass = false

        // Band 5: High-mid peak
        eqNode.bands[5].filterType = .parametric
        eqNode.bands[5].frequency = 4000
        eqNode.bands[5].bandwidth = 1.0
        eqNode.bands[5].gain = 0
        eqNode.bands[5].bypass = false

        // Band 6: High peak
        eqNode.bands[6].filterType = .parametric
        eqNode.bands[6].frequency = 8000
        eqNode.bands[6].bandwidth = 1.0
        eqNode.bands[6].gain = 0
        eqNode.bands[6].bypass = false

        // Band 7: Air peak
        eqNode.bands[7].filterType = .parametric
        eqNode.bands[7].frequency = 12000
        eqNode.bands[7].bandwidth = 1.0
        eqNode.bands[7].gain = 0
        eqNode.bands[7].bypass = false

        // Band 8: Brilliance peak
        eqNode.bands[8].filterType = .parametric
        eqNode.bands[8].frequency = 16000
        eqNode.bands[8].bandwidth = 1.0
        eqNode.bands[8].gain = 0
        eqNode.bands[8].bypass = false

        // Band 9: High shelf
        eqNode.bands[9].filterType = .highShelf
        eqNode.bands[9].frequency = 10000
        eqNode.bands[9].gain = 0
        eqNode.bands[9].bypass = false

        // Bypass by default
        eqNode.bypass = true

        print("[EffectsChain] EQ configured with 10 bands")
    }

    private func setupCompressor() {
        // Use distortion node for light compression/saturation
        distortionNode.loadFactoryPreset(.multiEcho1)
        distortionNode.wetDryMix = 0.0 // Start dry

        // Bypass by default
        distortionNode.bypass = true

        print("[EffectsChain] Compressor configured")
    }

    // MARK: - Connection

    /// Connect the effects chain between input and output nodes
    /// - Parameters:
    ///   - inputNode: Source node (e.g., mixer)
    ///   - outputNode: Destination node (e.g., output)
    func connect(from inputNode: AVAudioNode, to outputNode: AVAudioNode) {
        // Chain: input → reverb → EQ → distortion → output
        engine.connect(inputNode, to: reverbNode, format: format)
        engine.connect(reverbNode, to: eqNode, format: format)
        engine.connect(eqNode, to: distortionNode, format: format)
        engine.connect(distortionNode, to: outputNode, format: format)

        print("[EffectsChain] Connected: input → reverb → EQ → compressor → output")
    }

    // MARK: - Reverb Controls

    func setReverbEnabled(_ enabled: Bool) {
        reverbEnabled = enabled
        reverbNode.bypass = !enabled

        print("[EffectsChain] Reverb \(enabled ? "enabled" : "disabled")")
    }

    func setReverbWetDryMix(_ mix: Float) {
        let clampedMix = max(0, min(100, mix))
        reverbNode.wetDryMix = clampedMix

        print("[EffectsChain] Reverb wet/dry: \(clampedMix)%")
    }

    func setReverbPreset(_ preset: AVAudioUnitReverbPreset) {
        reverbNode.loadFactoryPreset(preset)

        print("[EffectsChain] Reverb preset: \(preset.rawValue)")
    }

    /// Set reverb room size (custom implementation)
    /// - Parameter size: Room size (0-1)
    func setReverbRoomSize(_ size: Float) {
        // Map size to appropriate preset
        let clampedSize = max(0, min(1, size))

        let preset: AVAudioUnitReverbPreset
        if clampedSize < 0.2 {
            preset = .smallRoom
        } else if clampedSize < 0.4 {
            preset = .mediumRoom
        } else if clampedSize < 0.6 {
            preset = .largeRoom
        } else if clampedSize < 0.8 {
            preset = .mediumHall
        } else {
            preset = .largeHall
        }

        reverbNode.loadFactoryPreset(preset)

        print("[EffectsChain] Reverb room size: \(clampedSize) (preset: \(preset.rawValue))")
    }

    // MARK: - Filter Controls

    func setFilterEnabled(_ enabled: Bool) {
        filterEnabled = enabled
        eqNode.bypass = !enabled

        print("[EffectsChain] Filter \(enabled ? "enabled" : "disabled")")
    }

    func setLowpassFilter(cutoffFrequency: Float, resonance: Float = 1.0) {
        // Use high shelf to create lowpass effect
        let clampedFreq = max(20, min(20000, cutoffFrequency))
        let clampedRes = max(0.5, min(5.0, resonance))

        eqNode.bands[9].filterType = .lowPass
        eqNode.bands[9].frequency = clampedFreq
        eqNode.bands[9].bandwidth = clampedRes
        eqNode.bands[9].bypass = false

        print("[EffectsChain] Lowpass filter: \(clampedFreq) Hz, Q: \(clampedRes)")
    }

    func setHighpassFilter(cutoffFrequency: Float, resonance: Float = 1.0) {
        // Use low shelf to create highpass effect
        let clampedFreq = max(20, min(20000, cutoffFrequency))
        let clampedRes = max(0.5, min(5.0, resonance))

        eqNode.bands[0].filterType = .highPass
        eqNode.bands[0].frequency = clampedFreq
        eqNode.bands[0].bandwidth = clampedRes
        eqNode.bands[0].bypass = false

        print("[EffectsChain] Highpass filter: \(clampedFreq) Hz, Q: \(clampedRes)")
    }

    func setBandpassFilter(centerFrequency: Float, bandwidth: Float) {
        // Use mid band for bandpass
        let clampedFreq = max(20, min(20000, centerFrequency))
        let clampedBW = max(0.1, min(5.0, bandwidth))

        // Attenuate lows
        eqNode.bands[0].filterType = .lowShelf
        eqNode.bands[0].frequency = clampedFreq / 2
        eqNode.bands[0].gain = -20
        eqNode.bands[0].bypass = false

        // Boost center
        eqNode.bands[4].filterType = .parametric
        eqNode.bands[4].frequency = clampedFreq
        eqNode.bands[4].bandwidth = clampedBW
        eqNode.bands[4].gain = 6
        eqNode.bands[4].bypass = false

        // Attenuate highs
        eqNode.bands[9].filterType = .highShelf
        eqNode.bands[9].frequency = clampedFreq * 2
        eqNode.bands[9].gain = -20
        eqNode.bands[9].bypass = false

        print("[EffectsChain] Bandpass filter: \(clampedFreq) Hz, BW: \(clampedBW)")
    }

    func setFilterCutoff(_ frequency: Float) {
        // Default to lowpass for simple cutoff control
        setLowpassFilter(cutoffFrequency: frequency)
    }

    func setEQBand(_ band: Int, frequency: Float, gain: Float, bandwidth: Float = 1.0) {
        guard band >= 0 && band < eqNode.bands.count else {
            print("[EffectsChain] Invalid EQ band: \(band)")
            return
        }

        let clampedFreq = max(20, min(20000, frequency))
        let clampedGain = max(-20, min(20, gain))
        let clampedBW = max(0.1, min(5.0, bandwidth))

        eqNode.bands[band].frequency = clampedFreq
        eqNode.bands[band].gain = clampedGain
        eqNode.bands[band].bandwidth = clampedBW
        eqNode.bands[band].bypass = false

        print("[EffectsChain] EQ band \(band): \(clampedFreq) Hz, gain: \(clampedGain) dB")
    }

    // MARK: - Compressor Controls

    func setCompressorEnabled(_ enabled: Bool) {
        compressorEnabled = enabled
        distortionNode.bypass = !enabled

        print("[EffectsChain] Compressor \(enabled ? "enabled" : "disabled")")
    }

    func setCompressorWetDryMix(_ mix: Float) {
        let clampedMix = max(0, min(100, mix))
        distortionNode.wetDryMix = clampedMix

        print("[EffectsChain] Compressor wet/dry: \(clampedMix)%")
    }

    func setCompressorPreset(_ preset: AVAudioUnitDistortionPreset) {
        distortionNode.loadFactoryPreset(preset)

        print("[EffectsChain] Compressor preset: \(preset.rawValue)")
    }

    // MARK: - Preset Management

    enum EffectsPreset {
        case off
        case subtle
        case moderate
        case heavy
        case custom
    }

    func applyPreset(_ preset: EffectsPreset) {
        switch preset {
        case .off:
            setReverbEnabled(false)
            setFilterEnabled(false)
            setCompressorEnabled(false)
            print("[EffectsChain] Applied preset: OFF")

        case .subtle:
            // Subtle reverb
            setReverbEnabled(true)
            setReverbRoomSize(0.3)
            setReverbWetDryMix(15)

            // No filter
            setFilterEnabled(false)

            // No compression
            setCompressorEnabled(false)

            print("[EffectsChain] Applied preset: SUBTLE")

        case .moderate:
            // Medium reverb
            setReverbEnabled(true)
            setReverbRoomSize(0.5)
            setReverbWetDryMix(30)

            // Gentle highpass to clean up lows
            setFilterEnabled(true)
            setHighpassFilter(cutoffFrequency: 80, resonance: 0.7)

            // Light compression
            setCompressorEnabled(true)
            setCompressorWetDryMix(20)

            print("[EffectsChain] Applied preset: MODERATE")

        case .heavy:
            // Large reverb
            setReverbEnabled(true)
            setReverbRoomSize(0.8)
            setReverbWetDryMix(50)

            // More aggressive filtering
            setFilterEnabled(true)
            setHighpassFilter(cutoffFrequency: 100, resonance: 1.0)

            // Heavier compression
            setCompressorEnabled(true)
            setCompressorWetDryMix(40)

            print("[EffectsChain] Applied preset: HEAVY")

        case .custom:
            print("[EffectsChain] Custom preset - use individual controls")
        }
    }

    // MARK: - State Query

    func getState() -> [String: Any] {
        return [
            "reverb": [
                "enabled": reverbEnabled,
                "wetDryMix": reverbNode.wetDryMix,
                "bypass": reverbNode.bypass
            ],
            "filter": [
                "enabled": filterEnabled,
                "bypass": eqNode.bypass
            ],
            "compressor": [
                "enabled": compressorEnabled,
                "wetDryMix": distortionNode.wetDryMix,
                "bypass": distortionNode.bypass
            ]
        ]
    }
}
