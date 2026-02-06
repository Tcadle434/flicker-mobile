/**
 * Player Store
 *
 * Manages playback state and audio controls using Zustand
 * Integrated with Native Swift Audio Module (Phase 5 Complete!)
 */

import { create } from 'zustand';
import { getNativeAudioBridge } from '../services/audio/nativeAudioBridge';
import { mapAdaptiveParameters } from '../services/audio/parameterMapper';
import { getTimeOfDayInput } from '../services/adaptive/TimeAdapter';
import { getSeason } from '../services/adaptive/SeasonAdapter';
import { getModeManifest } from '../services/audio/manifestLoader';
import { AdaptiveController } from '../integration/AdaptiveController';
import { logger } from '../lib/logger';
import type { PlayerState, SoundscapeMode, AudioLayer, PlaybackState } from '../types';

interface PlayerStore extends PlayerState {
  // Actions
  initialize: () => Promise<void>;
  setMode: (mode: SoundscapeMode) => Promise<void>;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setLayerVolume: (layer: AudioLayer, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  setLayerMuted: (layer: AudioLayer, muted: boolean) => void;
  toggleAdaptive: () => void;
  updateAdaptiveParameters: () => Promise<void>;
}

// Get native audio bridge singleton
const audioEngine = getNativeAudioBridge();
const adaptiveController = new AdaptiveController();
let adaptiveInterval: ReturnType<typeof setInterval> | null = null;
let adaptiveUpdateInFlight = false;

const mapNativeLayerToStore = (layer: string): AudioLayer => {
  return layer === 'binaural' ? 'synthesis' : (layer as AudioLayer);
};

const defaultAdaptiveInputs = {
  timeOfDay: getTimeOfDayInput(),
  weather: null,
  heartRate: null,
  season: getSeason(),
};

const defaultAdaptiveParameters = mapAdaptiveParameters(defaultAdaptiveInputs, 10);

const syncNativeMutes = (layers: PlayerState['layers']) => {
  (Object.keys(layers) as AudioLayer[]).forEach((layer) => {
    audioEngine.setLayerMuted(layer, layers[layer].muted);
  });
};

const startAdaptiveLoop = (set: (partial: Partial<PlayerState>) => void, get: () => PlayerStore) => {
  if (adaptiveInterval) return;

  adaptiveInterval = setInterval(async () => {
    if (!get().adaptiveEnabled) return;
    if (adaptiveUpdateInFlight) return;

    adaptiveUpdateInFlight = true;
    try {
      const inputs = await adaptiveController.collectInputs();
      set({ adaptiveInputs: inputs });
      await get().updateAdaptiveParameters();
    } catch (error) {
      logger.warn('Adaptive update loop error', error);
    } finally {
      adaptiveUpdateInFlight = false;
    }
  }, 30_000);
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  // Initial state
  mode: 'focus',
  playbackState: 'idle',
  layers: {
    ambient: { id: 'ambient', volume: 0.7, muted: false, currentLoopId: null },
    nature: { id: 'nature', volume: 0.5, muted: false, currentLoopId: null },
    melody: { id: 'melody', volume: 0.2, muted: false, currentLoopId: null },
    rhythm: { id: 'rhythm', volume: 0.0, muted: true, currentLoopId: null },
    synthesis: { id: 'synthesis', volume: 0.3, muted: false, currentLoopId: null },
  },
  masterVolume: 0.8,
  adaptiveEnabled: true,
  adaptiveInputs: defaultAdaptiveInputs,
  adaptiveParameters: defaultAdaptiveParameters,

  // Actions

  /**
   * Initialize audio engine
   */
  initialize: async () => {
    try {
      logger.info('Initializing audio engine from playerStore...');
      set({ playbackState: 'loading' });

      await audioEngine.initialize();

      // Load default mode (Focus)
      const state = get();
      const layerConfigs = await audioEngine.loadMode(state.mode, state.adaptiveParameters);
      set((current) => ({
        layers: {
          ...current.layers,
          ...Object.fromEntries(
            layerConfigs.map((config) => {
              const key = mapNativeLayerToStore(config.layer);
              return [
                key,
                {
                  ...current.layers[key],
                  currentLoopId: config.loopId ?? config.filename,
                  volume: config.volume,
                },
              ];
            })
          ),
        },
      }));
      syncNativeMutes(get().layers);
      await audioEngine.updateAdaptiveParameters(state.adaptiveParameters);
      startAdaptiveLoop(set, get);

      set({ playbackState: 'idle' });
      logger.info('Audio engine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize audio engine', error);
      set({ playbackState: 'error' });
      throw error;
    }
  },

  /**
   * Change soundscape mode
   */
  setMode: async (mode: SoundscapeMode) => {
    try {
      logger.info('Changing mode', { mode });
      set({ playbackState: 'loading' });

      const state = get();
      const layerConfigs = await audioEngine.loadMode(mode, state.adaptiveParameters);
      set((current) => ({
        layers: {
          ...current.layers,
          ...Object.fromEntries(
            layerConfigs.map((config) => {
              const key = mapNativeLayerToStore(config.layer);
              return [
                key,
                {
                  ...current.layers[key],
                  currentLoopId: config.loopId ?? config.filename,
                  volume: config.volume,
                },
              ];
            })
          ),
        },
      }));
      syncNativeMutes(get().layers);
      await audioEngine.updateAdaptiveParameters(state.adaptiveParameters);
      startAdaptiveLoop(set, get);

      set({ mode, playbackState: 'idle' });
      logger.info('Mode changed successfully', { mode });
    } catch (error) {
      logger.error('Failed to change mode', { mode, error });
      set({ playbackState: 'error' });
      throw error;
    }
  },

  /**
   * Start playback
   */
  play: async () => {
    try {
      const state = get();

      // Initialize if not ready
      if (!audioEngine.isReady()) {
        await get().initialize();
      }

      // If idle, need to load mode first
      if (state.playbackState === 'idle') {
        const layerConfigs = await audioEngine.loadMode(state.mode, state.adaptiveParameters);
        set((current) => ({
          layers: {
            ...current.layers,
            ...Object.fromEntries(
              layerConfigs.map((config) => {
                const key = mapNativeLayerToStore(config.layer);
                return [
                  key,
                  {
                    ...current.layers[key],
                    currentLoopId: config.loopId ?? config.filename,
                    volume: config.volume,
                  },
                ];
              })
            ),
          },
        }));
        syncNativeMutes(get().layers);
        await audioEngine.updateAdaptiveParameters(state.adaptiveParameters);
      }

      logger.info('Starting playback');
      await audioEngine.play();

      set({ playbackState: 'playing' });
      logger.info('Playback started');
    } catch (error) {
      logger.error('Failed to start playback', error);
      set({ playbackState: 'error' });
      throw error;
    }
  },

  /**
   * Pause playback
   */
  pause: () => {
    try {
      logger.info('Pausing playback');
      audioEngine.pause();
      set({ playbackState: 'paused' });
    } catch (error) {
      logger.error('Failed to pause playback', error);
    }
  },

  /**
   * Stop playback
   */
  stop: () => {
    try {
      logger.info('Stopping playback');
      audioEngine.stop();
      set({ playbackState: 'idle' });
    } catch (error) {
      logger.error('Failed to stop playback', error);
    }
  },

  /**
   * Set layer volume
   */
  setLayerVolume: (layer: AudioLayer, volume: number) => {
    try {
      audioEngine.setLayerVolume(layer, volume, 0.1); // 100ms fade
      if (volume > 0.001) {
        audioEngine.setLayerMuted(layer, false);
      }

      set((state) => ({
        layers: {
          ...state.layers,
          [layer]: {
            ...state.layers[layer],
            volume,
            muted: volume > 0.001 ? false : state.layers[layer].muted,
          },
        },
      }));

      logger.debug('Layer volume updated', { layer, volume });
    } catch (error) {
      logger.error('Failed to set layer volume', { layer, volume, error });
    }
  },

  /**
   * Set master volume
   */
  setMasterVolume: (volume: number) => {
    try {
      audioEngine.setMasterVolume(volume, 0.1); // 100ms fade
      set({ masterVolume: volume });
      logger.debug('Master volume updated', { volume });
    } catch (error) {
      logger.error('Failed to set master volume', { volume, error });
    }
  },

  /**
   * Mute/unmute layer
   */
  setLayerMuted: (layer: AudioLayer, muted: boolean) => {
    try {
      audioEngine.setLayerMuted(layer, muted, 0.1); // 100ms fade

      set((state) => ({
        layers: {
          ...state.layers,
          [layer]: {
            ...state.layers[layer],
            muted,
          },
        },
      }));

      logger.debug('Layer mute state updated', { layer, muted });
    } catch (error) {
      logger.error('Failed to set layer mute', { layer, muted, error });
    }
  },

  /**
   * Toggle adaptive mode
   */
  toggleAdaptive: () => {
    set((state) => {
      const newEnabled = !state.adaptiveEnabled;
      logger.info('Adaptive mode toggled', { enabled: newEnabled });
      return { adaptiveEnabled: newEnabled };
    });
  },

  /**
   * Update adaptive parameters based on current inputs
   */
  updateAdaptiveParameters: async () => {
    try {
      const state = get();

      if (!state.adaptiveEnabled) {
        logger.debug('Adaptive mode disabled, skipping parameter update');
        return;
      }

      const manifest = getModeManifest(state.mode);
      const baseFrequency = manifest.binauralFrequency
        ? (manifest.binauralFrequency.min + manifest.binauralFrequency.max) / 2
        : state.adaptiveParameters.binauralFrequency;

      const parameters = mapAdaptiveParameters(state.adaptiveInputs, baseFrequency);

      set({ adaptiveParameters: parameters });

      await audioEngine.updateAdaptiveParameters(parameters);

      logger.info('Adaptive parameters updated', { parameters });
    } catch (error) {
      logger.error('Failed to update adaptive parameters', error);
    }
  },
}));
