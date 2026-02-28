//
//  AudioBufferManager.swift
//  Flicker
//
//  Created by Claude Code
//  Audio file loading and buffer caching
//

import AVFoundation
import Foundation

// MARK: - Buffer Loading Errors

enum BufferLoadError: Error {
    case fileNotFound(String)
    case invalidFormat(String)
    case decodingError(String)
}

// MARK: - Audio Buffer Manager

class AudioBufferManager {
    // MARK: - Singleton

    static let shared = AudioBufferManager()

    // MARK: - Properties

    private var bufferCache = NSCache<NSString, AVAudioPCMBuffer>()
    private let fileManager = FileManager.default

    // Supported audio formats
    private let supportedExtensions = ["wav", "m4a", "mp3", "aac", "caf"]

    private lazy var searchableBundles: [Bundle] = {
        var bundles: [Bundle] = [Bundle.main]

        // Include the module bundle so local pod resources are discoverable.
        bundles.append(Bundle(for: FlickerAudioModule.self))

        if let bundleURLs = Bundle.main.urls(forResourcesWithExtension: "bundle", subdirectory: nil) {
            for url in bundleURLs {
                if let bundle = Bundle(url: url) {
                    bundles.append(bundle)
                }
            }
        }

        // De-duplicate by path while preserving order.
        var seen: Set<String> = []
        return bundles.filter { bundle in
            let path = bundle.bundlePath
            if seen.contains(path) {
                return false
            }
            seen.insert(path)
            return true
        }
    }()

    // MARK: - Initialization

    private init() {
        // Configure cache limits
        bufferCache.countLimit = 50 // Max 50 buffers
        bufferCache.totalCostLimit = 100 * 1024 * 1024 // Max 100 MB

        print("[AudioBufferManager] Initialized with cache limits: 50 buffers, 100 MB")
    }

    // MARK: - Buffer Loading

    /// Load an audio file from the bundle and return a PCM buffer
    /// - Parameter filename: Name of the audio file (e.g., "ambient_01.m4a")
    /// - Returns: AVAudioPCMBuffer containing the decoded audio
    func loadBuffer(fromFile filename: String) throws -> AVAudioPCMBuffer {
        // Check cache first
        let cacheKey = NSString(string: filename)
        if let cachedBuffer = bufferCache.object(forKey: cacheKey) {
            print("[AudioBufferManager] Cache hit: \(filename)")
            return cachedBuffer
        }

        print("[AudioBufferManager] Loading file: \(filename)")

        // Find file in bundle
        guard let fileURL = findFileInBundle(filename: filename) else {
            throw BufferLoadError.fileNotFound("File not found in bundle: \(filename)")
        }

        // Load and decode audio file
        let buffer = try loadAndDecodeFile(at: fileURL)

        // Cache the buffer
        let bufferSize = Int(buffer.frameLength * buffer.format.streamDescription.pointee.mBytesPerFrame)
        bufferCache.setObject(buffer, forKey: cacheKey, cost: bufferSize)

        print("[AudioBufferManager] Loaded and cached: \(filename) (\(bufferSize) bytes)")

        return buffer
    }

    /// Load multiple audio files concurrently
    /// - Parameter filenames: Array of filenames to load
    /// - Returns: Dictionary mapping filenames to buffers
    func loadBuffers(fromFiles filenames: [String]) async throws -> [String: AVAudioPCMBuffer] {
        var results: [String: AVAudioPCMBuffer] = [:]

        // Load files concurrently using TaskGroup
        try await withThrowingTaskGroup(of: (String, AVAudioPCMBuffer).self) { group in
            for filename in filenames {
                group.addTask {
                    let buffer = try self.loadBuffer(fromFile: filename)
                    return (filename, buffer)
                }
            }

            for try await (filename, buffer) in group {
                results[filename] = buffer
            }
        }

        print("[AudioBufferManager] Loaded \(results.count) buffers")
        return results
    }

    // MARK: - Private Methods

    private func findFileInBundle(filename: String) -> URL? {
        // Accept direct file paths from JS/native callers.
        if filename.hasPrefix("file://"), let directURL = URL(string: filename),
           fileManager.fileExists(atPath: directURL.path) {
            return directURL
        }
        if filename.hasPrefix("/"), fileManager.fileExists(atPath: filename) {
            return URL(fileURLWithPath: filename)
        }

        // Extract filename and extension
        let components = filename.components(separatedBy: ".")
        let name: String
        let ext: String

        if components.count > 1 {
            name = components.dropLast().joined(separator: ".")
            ext = components.last ?? ""
        } else {
            name = filename
            ext = "" // Will try all supported extensions
        }

        // If extension is provided, try that first
        if !ext.isEmpty {
            for bundle in searchableBundles {
                if let url = bundle.url(forResource: name, withExtension: ext) {
                    return url
                }
            }
        }

        // Try all supported extensions
        for supportedExt in supportedExtensions {
            for bundle in searchableBundles {
                if let url = bundle.url(forResource: name, withExtension: supportedExt) {
                    print("[AudioBufferManager] Found file: \(name).\(supportedExt) in \(bundle.bundleURL.lastPathComponent)")
                    return url
                }
            }
        }

        // Try common subdirectories inside all searchable bundles
        let subdirectories = ["audio", "sounds", "loops", "assets"]
        for bundle in searchableBundles {
            if let resourcePath = bundle.resourcePath {
                let resourceURL = URL(fileURLWithPath: resourcePath)

                for subdir in subdirectories {
                    let subdirURL = resourceURL.appendingPathComponent(subdir)

                    for supportedExt in supportedExtensions {
                        let fileURL = subdirURL.appendingPathComponent("\(name).\(supportedExt)")
                        if fileManager.fileExists(atPath: fileURL.path) {
                            print("[AudioBufferManager] Found file in \(bundle.bundleURL.lastPathComponent)/\(subdir): \(name).\(supportedExt)")
                            return fileURL
                        }
                    }
                }
            }
        }

        return nil
    }

    private func loadAndDecodeFile(at url: URL) throws -> AVAudioPCMBuffer {
        // Create audio file
        let audioFile: AVAudioFile
        do {
            audioFile = try AVAudioFile(forReading: url)
        } catch {
            throw BufferLoadError.invalidFormat("Failed to open audio file: \(error.localizedDescription)")
        }

        // Get file format
        let fileFormat = audioFile.processingFormat
        let frameCount = AVAudioFrameCount(audioFile.length)

        print("[AudioBufferManager] File info:")
        print("  - Format: \(fileFormat)")
        print("  - Sample rate: \(fileFormat.sampleRate) Hz")
        print("  - Channels: \(fileFormat.channelCount)")
        print("  - Frame count: \(frameCount)")
        print("  - Duration: \(Double(frameCount) / fileFormat.sampleRate) seconds")

        // Create buffer
        guard let buffer = AVAudioPCMBuffer(pcmFormat: fileFormat, frameCapacity: frameCount) else {
            throw BufferLoadError.decodingError("Failed to create buffer")
        }

        // Read file into buffer
        do {
            try audioFile.read(into: buffer)
            buffer.frameLength = frameCount
        } catch {
            throw BufferLoadError.decodingError("Failed to read file: \(error.localizedDescription)")
        }

        return buffer
    }

    // MARK: - Cache Management

    /// Clear all cached buffers
    func clearCache() {
        bufferCache.removeAllObjects()
        print("[AudioBufferManager] Cache cleared")
    }

    /// Remove a specific buffer from cache
    /// - Parameter filename: Filename of the buffer to remove
    func removeFromCache(filename: String) {
        let cacheKey = NSString(string: filename)
        bufferCache.removeObject(forKey: cacheKey)
        print("[AudioBufferManager] Removed from cache: \(filename)")
    }

    /// Get cache statistics
    func getCacheStats() -> [String: Any] {
        // Note: NSCache doesn't provide direct access to current size
        return [
            "countLimit": bufferCache.countLimit,
            "totalCostLimit": bufferCache.totalCostLimit
        ]
    }

    // MARK: - File Discovery

    /// List all audio files in the bundle
    /// - Returns: Array of audio filenames found in the bundle
    func discoverAudioFiles() -> [String] {
        var audioFiles: [String] = []
        let subdirectories = ["", "audio", "sounds", "loops", "assets"]

        for bundle in searchableBundles {
            guard let resourcePath = bundle.resourcePath else {
                continue
            }

            let resourceURL = URL(fileURLWithPath: resourcePath)
            for subdir in subdirectories {
                let dirURL = subdir.isEmpty ? resourceURL : resourceURL.appendingPathComponent(subdir)

                if let enumerator = fileManager.enumerator(at: dirURL, includingPropertiesForKeys: nil) {
                    for case let fileURL as URL in enumerator {
                        let ext = fileURL.pathExtension.lowercased()
                        if supportedExtensions.contains(ext) {
                            let relativePath = fileURL.lastPathComponent
                            audioFiles.append(relativePath)
                        }
                    }
                }
            }
        }

        print("[AudioBufferManager] Discovered \(audioFiles.count) audio files")
        return audioFiles
    }

    // MARK: - Format Conversion

    /// Convert a buffer to a different format (e.g., for resampling)
    /// - Parameters:
    ///   - buffer: Source buffer
    ///   - targetFormat: Target audio format
    /// - Returns: Converted buffer
    func convertBuffer(_ buffer: AVAudioPCMBuffer, to targetFormat: AVAudioFormat) throws -> AVAudioPCMBuffer {
        // If formats match, return original buffer
        if buffer.format == targetFormat {
            return buffer
        }

        print("[AudioBufferManager] Converting buffer from \(buffer.format.sampleRate)Hz to \(targetFormat.sampleRate)Hz")

        // Create converter
        guard let converter = AVAudioConverter(from: buffer.format, to: targetFormat) else {
            throw BufferLoadError.decodingError("Failed to create audio converter")
        }

        // Calculate output frame count
        let ratio = targetFormat.sampleRate / buffer.format.sampleRate
        let outputFrameCount = AVAudioFrameCount(Double(buffer.frameLength) * ratio)

        // Create output buffer
        guard let outputBuffer = AVAudioPCMBuffer(pcmFormat: targetFormat, frameCapacity: outputFrameCount) else {
            throw BufferLoadError.decodingError("Failed to create output buffer")
        }

        // Convert
        var error: NSError?
        let inputBlock: AVAudioConverterInputBlock = { inNumPackets, outStatus in
            outStatus.pointee = .haveData
            return buffer
        }

        converter.convert(to: outputBuffer, error: &error, withInputFrom: inputBlock)

        if let error = error {
            throw BufferLoadError.decodingError("Conversion failed: \(error.localizedDescription)")
        }

        outputBuffer.frameLength = outputFrameCount
        return outputBuffer
    }
}
