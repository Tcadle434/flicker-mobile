/**
 * nativeAudioModule.ts
 *
 * TypeScript wrapper for native Swift audio engine
 * Provides type-safe interface to SonaAudioModule
 */

import { NativeEventEmitter, Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

// MARK: - Types

export interface LayerConfig {
  layer: string;
  loopId: string;
  filename: string;
  volume: number;
}

export interface AudioState {
  state: 'stopped' | 'playing' | 'paused';
  masterVolume: number;
  isInitialized: boolean;
}

export interface PlaybackStateEvent {
  state: 'playing' | 'paused' | 'stopped';
}

export interface ErrorEvent {
  message: string;
  code: string;
}

export interface LoopTransitionEvent {
  layer: string;
  loopId: string;
}

// MARK: - Native Module

const SonaAudio = requireNativeModule('SonaAudio');

// MARK: - Event Emitter

const eventEmitter = new NativeEventEmitter(SonaAudio);

// MARK: - Native Audio Engine API

export const NativeAudioEngine = {
  // MARK: - Lifecycle

  /**
   * Initialize the audio engine
   */
  initialize: async (): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.initialize();
    } catch (error) {
      console.error('[NativeAudioEngine] Initialize error:', error);
      throw error;
    }
  },

  /**
   * Dispose the audio engine and clean up resources
   */
  dispose: async (): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.dispose();
    } catch (error) {
      console.error('[NativeAudioEngine] Dispose error:', error);
      throw error;
    }
  },

  // MARK: - Playback Control

  /**
   * Start playback
   */
  play: async (): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.play();
    } catch (error) {
      console.error('[NativeAudioEngine] Play error:', error);
      throw error;
    }
  },

  /**
   * Pause playback
   */
  pause: async (): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.pause();
    } catch (error) {
      console.error('[NativeAudioEngine] Pause error:', error);
      throw error;
    }
  },

  /**
   * Stop playback
   */
  stop: async (): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.stop();
    } catch (error) {
      console.error('[NativeAudioEngine] Stop error:', error);
      throw error;
    }
  },

  // MARK: - Volume Control

  /**
   * Set master volume with optional fade
   * @param volume Volume level (0-1)
   * @param fadeMs Fade duration in milliseconds (default: 0)
   */
  setMasterVolume: async (volume: number, fadeMs: number = 0): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.setMasterVolume(volume, fadeMs);
    } catch (error) {
      console.error('[NativeAudioEngine] SetMasterVolume error:', error);
      throw error;
    }
  },

  /**
   * Set layer volume with optional fade
   * @param layer Layer name ('ambient', 'nature', 'melody', 'rhythm', 'binaural')
   * @param volume Volume level (0-1)
   * @param fadeMs Fade duration in milliseconds (default: 0)
   */
  setLayerVolume: async (
    layer: string,
    volume: number,
    fadeMs: number = 0
  ): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.setLayerVolume(layer, volume, fadeMs);
    } catch (error) {
      console.error('[NativeAudioEngine] SetLayerVolume error:', error);
      throw error;
    }
  },

  /**
   * Mute/unmute a layer
   * @param layer Layer name
   * @param muted True to mute, false to unmute
   */
  setLayerMuted: async (layer: string, muted: boolean): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.setLayerMuted(layer, muted);
    } catch (error) {
      console.error('[NativeAudioEngine] SetLayerMuted error:', error);
      throw error;
    }
  },

  // MARK: - Mode Loading

  /**
   * Load a mode with specified layers
   * @param mode Mode name ('focus', 'relax', 'sleep')
   * @param layers Array of layer configurations
   */
  loadMode: async (mode: string, layers: LayerConfig[]): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.loadMode(mode, layers);
    } catch (error) {
      console.error('[NativeAudioEngine] LoadMode error:', error);
      throw error;
    }
  },

  // MARK: - State Query

  /**
   * Get current audio engine state
   */
  getState: async (): Promise<AudioState> => {
    try {
      return await SonaAudio.getState();
    } catch (error) {
      console.error('[NativeAudioEngine] GetState error:', error);
      throw error;
    }
  },

  // MARK: - Test Tone (Phase 1)

  /**
   * Play a test tone for verification
   * @param frequency Frequency in Hz (default: 440)
   * @param duration Duration in seconds (default: 10)
   */
  playTestTone: async (frequency: number = 440, duration: number = 10): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.playTestTone(frequency, duration);
    } catch (error) {
      console.error('[NativeAudioEngine] PlayTestTone error:', error);
      throw error;
    }
  },

  /**
   * Enable multi-layer mode with test tones (Phase 2 testing)
   */
  enableMultiLayerMode: async (): Promise<{ success: boolean }> => {
    try {
      // For now, we'll use loadMode to trigger multi-layer setup
      return await SonaAudio.loadMode('test', [
        { layer: 'ambient', loopId: 'test', filename: 'test.wav', volume: 0.7 },
        { layer: 'nature', loopId: 'test', filename: 'test.wav', volume: 0.5 },
        { layer: 'melody', loopId: 'test', filename: 'test.wav', volume: 0.6 },
        { layer: 'rhythm', loopId: 'test', filename: 'test.wav', volume: 0.4 },
        { layer: 'binaural', loopId: 'test', filename: 'test.wav', volume: 0.3 },
      ]);
    } catch (error) {
      console.error('[NativeAudioEngine] EnableMultiLayerMode error:', error);
      throw error;
    }
  },

  // MARK: - Effects Control (Phase 4)

  /**
   * Enable/disable reverb
   * @param enabled True to enable, false to disable
   */
  setReverbEnabled: async (enabled: boolean): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.setReverbEnabled(enabled);
    } catch (error) {
      console.error('[NativeAudioEngine] SetReverbEnabled error:', error);
      throw error;
    }
  },

  /**
   * Set reverb wet/dry mix
   * @param mix Mix level (0-100, 0=dry, 100=wet)
   */
  setReverbWetDryMix: async (mix: number): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.setReverbWetDryMix(mix);
    } catch (error) {
      console.error('[NativeAudioEngine] SetReverbWetDryMix error:', error);
      throw error;
    }
  },

  /**
   * Set reverb room size
   * @param size Room size (0-1)
   */
  setReverbRoomSize: async (size: number): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.setReverbRoomSize(size);
    } catch (error) {
      console.error('[NativeAudioEngine] SetReverbRoomSize error:', error);
      throw error;
    }
  },

  /**
   * Enable/disable filter
   * @param enabled True to enable, false to disable
   */
  setFilterEnabled: async (enabled: boolean): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.setFilterEnabled(enabled);
    } catch (error) {
      console.error('[NativeAudioEngine] SetFilterEnabled error:', error);
      throw error;
    }
  },

  /**
   * Set filter cutoff frequency
   * @param frequency Cutoff frequency in Hz
   */
  setFilterCutoff: async (frequency: number): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.setFilterCutoff(frequency);
    } catch (error) {
      console.error('[NativeAudioEngine] SetFilterCutoff error:', error);
      throw error;
    }
  },

  /**
   * Enable/disable compressor
   * @param enabled True to enable, false to disable
   */
  setCompressorEnabled: async (enabled: boolean): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.setCompressorEnabled(enabled);
    } catch (error) {
      console.error('[NativeAudioEngine] SetCompressorEnabled error:', error);
      throw error;
    }
  },

  /**
   * Set compressor wet/dry mix
   * @param mix Mix level (0-100)
   */
  setCompressorWetDryMix: async (mix: number): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.setCompressorWetDryMix(mix);
    } catch (error) {
      console.error('[NativeAudioEngine] SetCompressorWetDryMix error:', error);
      throw error;
    }
  },

  /**
   * Apply effects preset
   * @param preset Preset name ('off', 'subtle', 'moderate', 'heavy')
   */
  applyEffectsPreset: async (preset: string): Promise<{ success: boolean }> => {
    try {
      return await SonaAudio.applyEffectsPreset(preset);
    } catch (error) {
      console.error('[NativeAudioEngine] ApplyEffectsPreset error:', error);
      throw error;
    }
  },

  // MARK: - Event Listeners

  /**
   * Add listener for playback state changes
   */
  addPlaybackStateListener: (callback: (event: PlaybackStateEvent) => void) => {
    return eventEmitter.addListener('playbackStateChanged', callback);
  },

  /**
   * Add listener for errors
   */
  addErrorListener: (callback: (event: ErrorEvent) => void) => {
    return eventEmitter.addListener('error', callback);
  },

  /**
   * Add listener for loop transitions
   */
  addLoopTransitionListener: (callback: (event: LoopTransitionEvent) => void) => {
    return eventEmitter.addListener('loopTransitioned', callback);
  },

  /**
   * Remove all listeners
   */
  removeAllListeners: () => {
    eventEmitter.removeAllListeners('playbackStateChanged');
    eventEmitter.removeAllListeners('error');
    eventEmitter.removeAllListeners('loopTransitioned');
  },
};

// MARK: - Export

export default NativeAudioEngine;
