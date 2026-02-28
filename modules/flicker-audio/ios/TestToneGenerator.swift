//
//  TestToneGenerator.swift
//  Flicker
//
//  Created by Claude Code
//  Procedural audio generation for test tones and noise
//

import AVFoundation
import Accelerate

class TestToneGenerator {
    // MARK: - Constants

    static let sampleRate: Float = 48000.0
    static let channels: AVAudioChannelCount = 2

    // MARK: - Sine Wave Generation

    static func generateSineWave(
        frequency: Float,
        duration: TimeInterval,
        volume: Float = 0.5
    ) -> AVAudioPCMBuffer {
        let numSamples = Int(duration * Double(sampleRate))

        let format = AVAudioFormat(
            standardFormatWithSampleRate: Double(sampleRate),
            channels: channels
        )!

        guard let buffer = AVAudioPCMBuffer(
            pcmFormat: format,
            frameCapacity: AVAudioFrameCount(numSamples)
        ) else {
            fatalError("Failed to create audio buffer")
        }

        buffer.frameLength = buffer.frameCapacity

        guard let leftChannel = buffer.floatChannelData?[0],
              let rightChannel = buffer.floatChannelData?[1] else {
            fatalError("Failed to access channel data")
        }

        // Generate sine wave
        let twoPi = Float.pi * 2.0
        for i in 0..<numSamples {
            let time = Float(i) / sampleRate
            let value = sin(twoPi * frequency * time) * volume
            leftChannel[i] = value
            rightChannel[i] = value
        }

        // Apply fade in/out to prevent clicks
        applyFade(buffer: buffer, fadeSeconds: 0.1)

        print("[TestToneGenerator] Generated sine wave: \(frequency)Hz, \(duration)s")
        return buffer
    }

    // MARK: - Pink Noise Generation (Phase 2)

    static func generatePinkNoise(
        duration: TimeInterval,
        volume: Float = 0.3
    ) -> AVAudioPCMBuffer {
        let numSamples = Int(duration * Double(sampleRate))

        let format = AVAudioFormat(
            standardFormatWithSampleRate: Double(sampleRate),
            channels: channels
        )!

        guard let buffer = AVAudioPCMBuffer(
            pcmFormat: format,
            frameCapacity: AVAudioFrameCount(numSamples)
        ) else {
            fatalError("Failed to create audio buffer")
        }

        buffer.frameLength = buffer.frameCapacity

        guard let leftChannel = buffer.floatChannelData?[0],
              let rightChannel = buffer.floatChannelData?[1] else {
            fatalError("Failed to access channel data")
        }

        // Pink noise using Voss-McCartney algorithm
        var b0: Float = 0, b1: Float = 0, b2: Float = 0, b3: Float = 0, b4: Float = 0, b5: Float = 0, b6: Float = 0

        for i in 0..<numSamples {
            let white = Float.random(in: -1.0...1.0)

            b0 = 0.99886 * b0 + white * 0.0555179
            b1 = 0.99332 * b1 + white * 0.0750759
            b2 = 0.96900 * b2 + white * 0.1538520
            b3 = 0.86650 * b3 + white * 0.3104856
            b4 = 0.55000 * b4 + white * 0.5329522
            b5 = -0.7616 * b5 - white * 0.0168980

            let pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * volume * 0.11

            leftChannel[i] = pink
            rightChannel[i] = pink

            b6 = white * 0.115926
        }

        // Apply fade
        applyFade(buffer: buffer, fadeSeconds: 0.5)

        print("[TestToneGenerator] Generated pink noise: \(duration)s")
        return buffer
    }

    // MARK: - Brown Noise Generation (Phase 2)

    static func generateBrownNoise(
        duration: TimeInterval,
        volume: Float = 0.3
    ) -> AVAudioPCMBuffer {
        let numSamples = Int(duration * Double(sampleRate))

        let format = AVAudioFormat(
            standardFormatWithSampleRate: Double(sampleRate),
            channels: channels
        )!

        guard let buffer = AVAudioPCMBuffer(
            pcmFormat: format,
            frameCapacity: AVAudioFrameCount(numSamples)
        ) else {
            fatalError("Failed to create audio buffer")
        }

        buffer.frameLength = buffer.frameCapacity

        guard let leftChannel = buffer.floatChannelData?[0],
              let rightChannel = buffer.floatChannelData?[1] else {
            fatalError("Failed to access channel data")
        }

        // Brown noise (Brownian motion)
        var lastValue: Float = 0

        for i in 0..<numSamples {
            let white = Float.random(in: -1.0...1.0)
            lastValue = (lastValue + white * 0.02) * 0.98

            // Clamp to prevent runaway values
            lastValue = max(-1.0, min(1.0, lastValue))

            let brown = lastValue * volume

            leftChannel[i] = brown
            rightChannel[i] = brown
        }

        // Apply fade
        applyFade(buffer: buffer, fadeSeconds: 0.5)

        print("[TestToneGenerator] Generated brown noise: \(duration)s")
        return buffer
    }

    // MARK: - White Noise Generation (Phase 2)

    static func generateWhiteNoise(
        duration: TimeInterval,
        volume: Float = 0.3
    ) -> AVAudioPCMBuffer {
        let numSamples = Int(duration * Double(sampleRate))

        let format = AVAudioFormat(
            standardFormatWithSampleRate: Double(sampleRate),
            channels: channels
        )!

        guard let buffer = AVAudioPCMBuffer(
            pcmFormat: format,
            frameCapacity: AVAudioFrameCount(numSamples)
        ) else {
            fatalError("Failed to create audio buffer")
        }

        buffer.frameLength = buffer.frameCapacity

        guard let leftChannel = buffer.floatChannelData?[0],
              let rightChannel = buffer.floatChannelData?[1] else {
            fatalError("Failed to access channel data")
        }

        // White noise (pure random)
        for i in 0..<numSamples {
            let value = Float.random(in: -1.0...1.0) * volume
            leftChannel[i] = value
            rightChannel[i] = value
        }

        // Apply fade
        applyFade(buffer: buffer, fadeSeconds: 0.2)

        print("[TestToneGenerator] Generated white noise: \(duration)s")
        return buffer
    }

    // MARK: - Binaural Beat Generation (Phase 3)

    static func generateBinauralBeat(
        baseFrequency: Float,
        beatFrequency: Float,
        duration: TimeInterval,
        volume: Float = 0.4
    ) -> AVAudioPCMBuffer {
        let numSamples = Int(duration * Double(sampleRate))

        let format = AVAudioFormat(
            standardFormatWithSampleRate: Double(sampleRate),
            channels: channels
        )!

        guard let buffer = AVAudioPCMBuffer(
            pcmFormat: format,
            frameCapacity: AVAudioFrameCount(numSamples)
        ) else {
            fatalError("Failed to create audio buffer")
        }

        buffer.frameLength = buffer.frameCapacity

        guard let leftChannel = buffer.floatChannelData?[0],
              let rightChannel = buffer.floatChannelData?[1] else {
            fatalError("Failed to access channel data")
        }

        // Generate binaural beat
        // Left ear: base frequency
        // Right ear: base frequency + beat frequency
        let leftFreq = baseFrequency
        let rightFreq = baseFrequency + beatFrequency
        let twoPi = Float.pi * 2.0

        for i in 0..<numSamples {
            let time = Float(i) / sampleRate
            leftChannel[i] = sin(twoPi * leftFreq * time) * volume
            rightChannel[i] = sin(twoPi * rightFreq * time) * volume
        }

        // Apply fade
        applyFade(buffer: buffer, fadeSeconds: 0.1)

        print("[TestToneGenerator] Generated binaural beat: \(baseFrequency)Hz + \(beatFrequency)Hz, \(duration)s")
        return buffer
    }

    // MARK: - Utility Functions

    private static func applyFade(buffer: AVAudioPCMBuffer, fadeSeconds: Float) {
        let fadeSamples = Int(fadeSeconds * sampleRate)
        let totalSamples = Int(buffer.frameLength)

        guard let leftChannel = buffer.floatChannelData?[0],
              let rightChannel = buffer.floatChannelData?[1] else {
            return
        }

        // Fade in
        for i in 0..<min(fadeSamples, totalSamples) {
            let gain = Float(i) / Float(fadeSamples)
            leftChannel[i] *= gain
            rightChannel[i] *= gain
        }

        // Fade out
        for i in 0..<min(fadeSamples, totalSamples) {
            let index = totalSamples - 1 - i
            let gain = Float(i) / Float(fadeSamples)
            leftChannel[index] *= gain
            rightChannel[index] *= gain
        }
    }

    // MARK: - Test Tone Presets (Phase 2)

    enum ToneType {
        case ambient      // 220 Hz sine
        case nature       // Pink noise
        case melody       // 440 Hz sine
        case rhythm       // Brown noise
        case binaural     // Binaural beat (100 Hz + 4 Hz)
    }

    static func generateTestTone(
        type: ToneType,
        duration: TimeInterval = 8.0,
        volume: Float = 0.5
    ) -> AVAudioPCMBuffer {
        switch type {
        case .ambient:
            return generateSineWave(frequency: 220, duration: duration, volume: volume)
        case .nature:
            return generatePinkNoise(duration: duration, volume: volume * 0.6)
        case .melody:
            return generateSineWave(frequency: 440, duration: duration, volume: volume)
        case .rhythm:
            return generateBrownNoise(duration: duration, volume: volume * 0.6)
        case .binaural:
            return generateBinauralBeat(baseFrequency: 100, beatFrequency: 4, duration: duration, volume: volume)
        }
    }
}
