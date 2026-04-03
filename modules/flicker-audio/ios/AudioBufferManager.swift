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
    case bufferTooLarge(String)
    case decodingError(String)
}

enum AudioPlaybackAsset {
    case buffer(AVAudioPCMBuffer)
    case streamedFile(URL)
}

// MARK: - Audio Buffer Manager

class AudioBufferManager {
    // MARK: - Singleton

    static let shared = AudioBufferManager()

    // MARK: - Properties

    private var bufferCache = NSCache<NSString, AVAudioPCMBuffer>()
    private let fileManager = FileManager.default
    private let maxDecodedBufferBytes: UInt64 = 256 * 1024 * 1024

    // Supported audio formats
    private let supportedExtensions = ["wav", "m4a", "mp3", "aac", "caf"]
    private let resourceBundleNames = ["FlickerAudioAssets", "FlickerAudio-FlickerAudioAssets"]

    private lazy var searchableBundles: [Bundle] = {
        let rootBundles: [Bundle] = [Bundle.main, Bundle(for: FlickerAudioModule.self)]
        var bundles: [Bundle] = rootBundles

        // Include the module bundle so local pod resources are discoverable.
        for rootBundle in rootBundles {
            if let resourceURL = rootBundle.resourceURL {
                for bundleName in resourceBundleNames {
                    let directBundleURL = resourceURL.appendingPathComponent("\(bundleName).bundle")
                    if let bundle = Bundle(url: directBundleURL) {
                        bundles.append(bundle)
                    }
                }
            }

            if let bundleURLs = rootBundle.urls(forResourcesWithExtension: "bundle", subdirectory: nil) {
                for url in bundleURLs {
                    if let bundle = Bundle(url: url) {
                        bundles.append(bundle)
                    }
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
        let playbackAsset = try loadPlaybackAsset(fromFile: filename)
        switch playbackAsset {
        case .buffer(let buffer):
            return buffer
        case .streamedFile(let url):
            throw BufferLoadError.bufferTooLarge("Asset must be streamed from disk: \(url.lastPathComponent)")
        }
    }

    func loadPlaybackAsset(fromFile filename: String, preferStreaming: Bool = false) throws -> AudioPlaybackAsset {
        let cacheKey = NSString(string: filename)
        if !preferStreaming, let cachedBuffer = bufferCache.object(forKey: cacheKey) {
            print("[AudioBufferManager] Cache hit: \(filename)")
            return .buffer(cachedBuffer)
        }

        print("[AudioBufferManager] Loading file: \(filename)")
        let fileURL = try resolveFileURL(filename: filename)

        if preferStreaming {
            print("[AudioBufferManager] Using streamed file playback for \(filename)")
            return .streamedFile(fileURL)
        }

        do {
            let buffer = try loadAndDecodeFile(at: fileURL)
            let bufferSize = Int(buffer.frameLength * buffer.format.streamDescription.pointee.mBytesPerFrame)
            bufferCache.setObject(buffer, forKey: cacheKey, cost: bufferSize)

            print("[AudioBufferManager] Loaded and cached: \(filename) (\(bufferSize) bytes)")
            return .buffer(buffer)
        } catch BufferLoadError.bufferTooLarge {
            print("[AudioBufferManager] Falling back to streamed file playback for \(filename)")
            return .streamedFile(fileURL)
        }
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

    func resolveFileURL(filename: String) throws -> URL {
        guard let fileURL = findFileInBundle(filename: filename) else {
            let bundlePaths = searchableBundles.map(\.bundlePath).joined(separator: ", ")
            print("[AudioBufferManager] Search failed for \(filename). Bundles: \(bundlePaths)")
            throw BufferLoadError.fileNotFound("File not found in bundle: \(filename)")
        }

        return fileURL
    }

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
        let bytesPerFrame = UInt64(fileFormat.streamDescription.pointee.mBytesPerFrame)
        let estimatedDecodedSize = UInt64(frameCount) * bytesPerFrame

        print("[AudioBufferManager] File info:")
        print("  - Format: \(fileFormat)")
        print("  - Sample rate: \(fileFormat.sampleRate) Hz")
        print("  - Channels: \(fileFormat.channelCount)")
        print("  - Frame count: \(frameCount)")
        print("  - Duration: \(Double(frameCount) / fileFormat.sampleRate) seconds")
        print("  - Estimated decoded size: \(estimatedDecodedSize) bytes")

        if bytesPerFrame == 0 {
            throw BufferLoadError.invalidFormat("Invalid PCM format: bytes per frame is 0")
        }

        if estimatedDecodedSize > maxDecodedBufferBytes {
            throw BufferLoadError.bufferTooLarge(
                "Decoded audio buffer too large (\(estimatedDecodedSize) bytes). " +
                "This engine currently supports shorter loop assets only."
            )
        }

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
