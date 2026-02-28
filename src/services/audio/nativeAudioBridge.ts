/**
 * nativeAudioBridge.ts
 *
 * Bridge between playerStore and native audio module
 * Provides a clean interface matching the old AudioEngine API
 */

import NativeAudioEngine from './nativeAudioModule';
import { logger } from '../../lib/logger';
import { buildLayerConfigs } from './loopLibrary';
import type {
  SoundscapeMode,
  AudioLayer,
  AdaptiveParameters,
} from '../../types';
import type { LayerConfig } from './nativeAudioModule';

/**
 * Native Audio Bridge
 * Wraps the native module to provide a familiar interface for the player store
 */
class NativeAudioBridge {
  private initialized = false;
  private currentMode: SoundscapeMode | null = null;

  /**
   * Check if audio engine is ready
   */
  isReady(): boolean {
    return this.initialized;
  }

  /**
   * Initialize the native audio engine
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('NativeAudioBridge already initialized');
      return;
    }

    try {
      logger.info('Initializing native audio engine...');

      await NativeAudioEngine.initialize();

      this.initialized = true;
      logger.info('✅ Native audio engine initialized');
    } catch (error) {
      logger.error('❌ Failed to initialize native audio engine', error);
      throw error;
    }
  }

  /**
   * Load a soundscape mode
   */
  async loadMode(mode: SoundscapeMode, adaptiveParameters: AdaptiveParameters): Promise<LayerConfig[]> {
    try {
      logger.info(`Loading mode: ${mode}`, { adaptiveParameters });

      if (!this.initialized) {
        await this.initialize();
      }

      // Store current mode
      this.currentMode = mode;

      const layerConfigs = buildLayerConfigs(mode);
      await NativeAudioEngine.loadMode(mode, layerConfigs);

      logger.info(`✅ Mode loaded: ${mode}`, { layers: layerConfigs.length });
      return layerConfigs;
    } catch (error) {
      logger.error(`Failed to load mode: ${mode}`, error);
      throw error;
    }
  }

  /**
   * Start playback
   */
  async play(): Promise<void> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      await NativeAudioEngine.play();
      logger.info('✅ Playback started');
    } catch (error) {
      logger.error('Failed to start playback', error);
      throw error;
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    void NativeAudioEngine.pause()
      .then(() => logger.info('Playback paused'))
      .catch((error) => {
        logger.error('Failed to pause playback', error);
      });
  }

  /**
   * Stop playback
   */
  stop(): void {
    void NativeAudioEngine.stop()
      .then(() => logger.info('Playback stopped'))
      .catch((error) => {
        logger.error('Failed to stop playback', error);
      });
  }

  /**
   * Set layer volume
   * @param layer Layer name
   * @param volume Volume (0-1)
   * @param fadeTime Fade duration in seconds
   */
  setLayerVolume(layer: AudioLayer, volume: number, fadeTime: number = 0.1): void {
    // Map 'synthesis' to 'binaural' for native module
    const nativeLayer = layer === 'synthesis' ? 'binaural' : layer;

    // Convert fadeTime from seconds to milliseconds
    const fadeMs = fadeTime * 1000;

    void NativeAudioEngine.setLayerVolume(nativeLayer, volume, fadeMs)
      .then(() => logger.debug(`Layer volume set: ${layer} = ${volume}`))
      .catch((error) => {
        logger.error(`Failed to set layer volume: ${layer}`, error);
      });
  }

  /**
   * Set master volume
   * @param volume Volume (0-1)
   * @param fadeTime Fade duration in seconds
   */
  setMasterVolume(volume: number, fadeTime: number = 0.1): void {
    // Convert fadeTime from seconds to milliseconds
    const fadeMs = fadeTime * 1000;

    void NativeAudioEngine.setMasterVolume(volume, fadeMs)
      .then(() => logger.debug(`Master volume set: ${volume}`))
      .catch((error) => {
        logger.error('Failed to set master volume', error);
      });
  }

  /**
   * Mute/unmute a layer
   * @param layer Layer name
   * @param muted Whether to mute
   * @param fadeTime Fade duration in seconds (unused for mute, but kept for API compatibility)
   */
  setLayerMuted(layer: AudioLayer, muted: boolean, fadeTime: number = 0.1): void {
    // Map 'synthesis' to 'binaural' for native module
    const nativeLayer = layer === 'synthesis' ? 'binaural' : layer;

    void NativeAudioEngine.setLayerMuted(nativeLayer, muted)
      .then(() => logger.debug(`Layer mute set: ${layer} = ${muted}`))
      .catch((error) => {
        logger.error(`Failed to set layer mute: ${layer}`, error);
      });
  }

  /**
   * Update adaptive parameters
   * For now, this is a placeholder. Will be implemented when adaptive system is ready.
   */
  async updateAdaptiveParameters(parameters: AdaptiveParameters): Promise<void> {
    try {
      logger.info('Updating adaptive parameters', parameters);

      if (!this.initialized) {
        await this.initialize();
      }

      const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
      const fadeMs = 200;

      const rhythmVolume = clamp(0.15 + parameters.energy * 0.4, 0, 0.8);
      const melodyVolume = clamp(0.25 + parameters.energy * 0.25, 0.12, 0.7);
      const ambientVolume = clamp(0.6 - parameters.energy * 0.1, 0.3, 0.9);
      const natureVolume = clamp(0.4 + parameters.density * 0.2, 0.0, 0.8);
      const binauralVolume = clamp(0.25 + parameters.energy * 0.1, 0.1, 0.5);

      await Promise.all([
        NativeAudioEngine.setLayerVolume('rhythm', rhythmVolume, fadeMs),
        NativeAudioEngine.setLayerVolume('melody', melodyVolume, fadeMs),
        NativeAudioEngine.setLayerVolume('ambient', ambientVolume, fadeMs),
        NativeAudioEngine.setLayerVolume('nature', natureVolume, fadeMs),
        NativeAudioEngine.setLayerVolume('binaural', binauralVolume, fadeMs),
      ]);

      const reverbEnabled = parameters.density < -0.1;
      const reverbMix = clamp((0.5 - parameters.density) * 50, 10, 70);
      const filterEnabled = parameters.brightness < 0.35;
      const filterCutoff = clamp(800 + parameters.brightness * 7200, 800, 8000);
      const compressorEnabled = parameters.energy > 0.6;

      await Promise.all([
        NativeAudioEngine.setReverbEnabled(reverbEnabled),
        NativeAudioEngine.setReverbWetDryMix(reverbMix),
        NativeAudioEngine.setFilterEnabled(filterEnabled),
        NativeAudioEngine.setFilterCutoff(filterCutoff),
        NativeAudioEngine.setCompressorEnabled(compressorEnabled),
      ]);

      logger.debug('Adaptive parameters applied');
    } catch (error) {
      logger.error('Failed to update adaptive parameters', error);
    }
  }

  /**
   * Get current state
   */
  async getState(): Promise<any> {
    try {
      return await NativeAudioEngine.getState();
    } catch (error) {
      logger.error('Failed to get state', error);
      return null;
    }
  }

  /**
   * Dispose the audio engine
   */
  async dispose(): Promise<void> {
    try {
      await NativeAudioEngine.dispose();
      this.initialized = false;
      this.currentMode = null;
      logger.info('Native audio engine disposed');
    } catch (error) {
      logger.error('Failed to dispose native audio engine', error);
    }
  }
}

// Export singleton instance
let bridgeInstance: NativeAudioBridge | null = null;

export function getNativeAudioBridge(): NativeAudioBridge {
  if (!bridgeInstance) {
    bridgeInstance = new NativeAudioBridge();
  }
  return bridgeInstance;
}

export default NativeAudioBridge;
