//
//  CrossfadeManager.swift
//  Flicker
//
//  Created by Claude Code
//  Equal-power crossfade curve generation for seamless audio transitions
//

import Foundation
import Accelerate

class CrossfadeManager {
    // MARK: - Crossfade Curve Generation

    /// Generate equal-power crossfade curves
    /// Uses cosine/sine curves to maintain constant power during crossfade
    /// Mathematically: cos²(x) + sin²(x) = 1 (maintains constant loudness)
    ///
    /// - Parameter duration: Crossfade duration in seconds
    /// - Returns: Tuple of (fadeOut curve, fadeIn curve) as arrays of Float
    static func generateEqualPowerCurves(duration: TimeInterval) -> (fadeOut: [Float], fadeIn: [Float]) {
        // Use 50 steps per second for smooth crossfades
        let stepsPerSecond = 50
        let numSamples = Int(duration * Double(stepsPerSecond))

        var fadeOut = [Float](repeating: 0, count: numSamples)
        var fadeIn = [Float](repeating: 0, count: numSamples)

        // Generate curves using equal-power formula
        for i in 0..<numSamples {
            let position = Float(i) / Float(numSamples - 1)

            // Fade out: cos(position * π/2)
            fadeOut[i] = cos(position * .pi / 2.0)

            // Fade in: sin(position * π/2)
            fadeIn[i] = sin(position * .pi / 2.0)
        }

        return (fadeOut, fadeIn)
    }

    /// Generate linear crossfade curves (fallback for debugging)
    /// - Parameter duration: Crossfade duration in seconds
    /// - Returns: Tuple of (fadeOut curve, fadeIn curve) as arrays of Float
    static func generateLinearCurves(duration: TimeInterval) -> (fadeOut: [Float], fadeIn: [Float]) {
        let stepsPerSecond = 50
        let numSamples = Int(duration * Double(stepsPerSecond))

        var fadeOut = [Float](repeating: 0, count: numSamples)
        var fadeIn = [Float](repeating: 0, count: numSamples)

        for i in 0..<numSamples {
            let position = Float(i) / Float(numSamples - 1)

            fadeOut[i] = 1.0 - position
            fadeIn[i] = position
        }

        return (fadeOut, fadeIn)
    }

    /// Verify that crossfade curves maintain constant power
    /// For equal-power curves: fadeOut² + fadeIn² should ≈ 1.0
    /// - Parameters:
    ///   - fadeOut: Fade out curve
    ///   - fadeIn: Fade in curve
    /// - Returns: True if curves are valid, false otherwise
    static func verifyCrossfadeCurves(fadeOut: [Float], fadeIn: [Float]) -> Bool {
        guard fadeOut.count == fadeIn.count else {
            print("[CrossfadeManager] ERROR: Curve lengths don't match")
            return false
        }

        var maxError: Float = 0
        var totalError: Float = 0

        for i in 0..<fadeOut.count {
            let powerSum = pow(fadeOut[i], 2) + pow(fadeIn[i], 2)
            let error = abs(powerSum - 1.0)

            totalError += error
            if error > maxError {
                maxError = error
            }
        }

        let avgError = totalError / Float(fadeOut.count)

        print("[CrossfadeManager] Curve verification:")
        print("  Max error: \(maxError)")
        print("  Avg error: \(avgError)")
        print("  Valid: \(maxError < 0.01)")

        return maxError < 0.01 // Allow 1% error tolerance
    }

    // MARK: - Crossfade Presets

    enum CrossfadePreset {
        case veryFast   // 1 second
        case fast       // 2 seconds
        case normal     // 4 seconds
        case slow       // 8 seconds
        case verySlow   // 16 seconds

        var duration: TimeInterval {
            switch self {
            case .veryFast: return 1.0
            case .fast: return 2.0
            case .normal: return 4.0
            case .slow: return 8.0
            case .verySlow: return 16.0
            }
        }
    }

    /// Get crossfade curves for a preset duration
    /// - Parameter preset: Crossfade preset
    /// - Returns: Tuple of (fadeOut curve, fadeIn curve)
    static func getCurvesForPreset(_ preset: CrossfadePreset) -> (fadeOut: [Float], fadeIn: [Float]) {
        return generateEqualPowerCurves(duration: preset.duration)
    }

    // MARK: - Curve Testing

    /// Test crossfade curve generation and verification
    static func testCrossfadeCurves() {
        print("[CrossfadeManager] Testing crossfade curves...")

        // Test equal-power curves
        let (fadeOut, fadeIn) = generateEqualPowerCurves(duration: 4.0)
        let isValid = verifyCrossfadeCurves(fadeOut: fadeOut, fadeIn: fadeIn)

        if isValid {
            print("[CrossfadeManager] ✅ Equal-power curves are valid")
        } else {
            print("[CrossfadeManager] ❌ Equal-power curves failed verification")
        }

        // Print sample values
        print("[CrossfadeManager] Sample values (4s crossfade, 200 steps):")
        let sampleIndices = [0, 50, 100, 150, 199]
        for i in sampleIndices {
            if i < fadeOut.count {
                let powerSum = pow(fadeOut[i], 2) + pow(fadeIn[i], 2)
                print("  Step \(i): fadeOut=\(fadeOut[i].rounded(to: 3)), fadeIn=\(fadeIn[i].rounded(to: 3)), power=\(powerSum.rounded(to: 3))")
            }
        }
    }
}

// MARK: - Float Extension

extension Float {
    /// Round to specified number of decimal places
    func rounded(to places: Int) -> Float {
        let divisor = pow(10.0, Float(places))
        return (self * divisor).rounded() / divisor
    }
}
