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
import {
  AUDIO_LAYERS,
  DEFAULT_MIX,
  buildLayerConfigs,
  getModeTrackCatalog,
  getSelectedTracks,
} from '../services/audio/loopLibrary';
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
  setLayerLoop: (layer: AudioLayer, loopId: string) => Promise<void>;
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

type LoopSelectionMap = Partial<Record<AudioLayer, string | null>>;
type VolumeMap = Partial<Record<AudioLayer, number>>;

const KEY_LOCKED_LAYERS: AudioLayer[] = ['ambient', 'melody'];

const getPartnerLayer = (layer: AudioLayer): AudioLayer | null => {
  if (layer === 'ambient') return 'melody';
  if (layer === 'melody') return 'ambient';
  return null;
};

const areTracksCompatible = (
  currentKey?: string,
  partnerKey?: string,
) => !currentKey || !partnerKey || currentKey === partnerKey;

const getLayerSelections = (layers: PlayerState['layers']): LoopSelectionMap =>
  Object.fromEntries(
    AUDIO_LAYERS.map((layer) => [layer, layers[layer].currentLoopId])
  ) as LoopSelectionMap;

const getLayerVolumes = (layers: PlayerState['layers']): VolumeMap =>
  Object.fromEntries(
    AUDIO_LAYERS.map((layer) => [layer, layers[layer].volume])
  ) as VolumeMap;

const buildModeLayerState = (
  currentLayers: PlayerState['layers'],
  mode: SoundscapeMode,
  loopSelections: LoopSelectionMap = {},
  volumeOverrides: VolumeMap = {},
) => {
  const manifest = getModeManifest(mode);
  const trackCatalog = getModeTrackCatalog(mode);
  const selectedTracks = getSelectedTracks(mode, loopSelections);
  const layerConfigs = buildLayerConfigs(mode, loopSelections, volumeOverrides);

  return {
    layerConfigs,
    layers: Object.fromEntries(
      AUDIO_LAYERS.map((layer) => [
        layer,
        {
          ...currentLayers[layer],
          currentLoopId: selectedTracks[layer]?.id ?? null,
          availableTracks: trackCatalog[layer],
          volume: volumeOverrides[layer] ?? manifest.defaultMix?.[layer] ?? DEFAULT_MIX[layer],
        },
      ])
    ) as PlayerState['layers'],
  };
};

const resolveLoopChange = (
  mode: SoundscapeMode,
  layers: PlayerState['layers'],
  layer: AudioLayer,
  loopId: string,
): LoopSelectionMap | null => {
  const catalog = getModeTrackCatalog(mode);
  const targetTrack = catalog[layer].find((track) => track.id === loopId);
  if (!targetTrack) {
    return null;
  }

  const nextSelections = {
    ...getLayerSelections(layers),
    [layer]: targetTrack.id,
  };

  if (!KEY_LOCKED_LAYERS.includes(layer)) {
    return nextSelections;
  }

  const partnerLayer = getPartnerLayer(layer);
  if (!partnerLayer) {
    return nextSelections;
  }

  const partnerTracks = catalog[partnerLayer];
  const currentPartnerTrack =
    partnerTracks.find((track) => track.id === nextSelections[partnerLayer]) ??
    partnerTracks[0] ??
    null;

  if (!currentPartnerTrack || areTracksCompatible(targetTrack.key, currentPartnerTrack.key)) {
    return nextSelections;
  }

  const compatiblePartner = partnerTracks.find((track) =>
    areTracksCompatible(targetTrack.key, track.key)
  );

  if (!compatiblePartner) {
    return null;
  }

  nextSelections[partnerLayer] = compatiblePartner.id;
  return nextSelections;
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
    ambient: { id: 'ambient', volume: 0.4, muted: false, currentLoopId: null, availableTracks: [] },
    nature: { id: 'nature', volume: 0.35, muted: false, currentLoopId: null, availableTracks: [] },
    melody: { id: 'melody', volume: 0.25, muted: false, currentLoopId: null, availableTracks: [] },
    rhythm: { id: 'rhythm', volume: 0.0, muted: true, currentLoopId: null, availableTracks: [] },
    synthesis: { id: 'synthesis', volume: 0.3, muted: false, currentLoopId: null, availableTracks: [] },
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
      const nextState = buildModeLayerState(get().layers, state.mode);
      await audioEngine.loadMode(state.mode, state.adaptiveParameters, nextState.layerConfigs);
      set({ layers: nextState.layers });
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
      const nextState = buildModeLayerState(get().layers, mode);
      await audioEngine.loadMode(mode, state.adaptiveParameters, nextState.layerConfigs);
      set({ layers: nextState.layers });
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
      let didInitialize = false;

      // Initialize if not ready
      if (!audioEngine.isReady()) {
        await get().initialize();
        didInitialize = true;
      }

      const state = get();

      // If idle, need to load mode first using the store's current loop selections and volumes.
      if (!didInitialize && state.playbackState === 'idle') {
        const loopSelections = getLayerSelections(state.layers);
        const volumeOverrides = getLayerVolumes(state.layers);
        const nextState = buildModeLayerState(state.layers, state.mode, loopSelections, volumeOverrides);
        await audioEngine.loadMode(state.mode, state.adaptiveParameters, nextState.layerConfigs);
        set({ layers: nextState.layers });
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
   * Swap the current loop for a layer.
   */
  setLayerLoop: async (layer: AudioLayer, loopId: string) => {
    try {
      const state = get();
      const nextSelections = resolveLoopChange(state.mode, state.layers, layer, loopId);

      if (!nextSelections) {
        logger.warn('Rejected incompatible loop change', { layer, loopId });
        return;
      }

      const nextSelectedTracks = getSelectedTracks(state.mode, nextSelections);
      const changedLayers = AUDIO_LAYERS.filter(
        (candidateLayer) => nextSelections[candidateLayer] !== state.layers[candidateLayer].currentLoopId
      );

      if (changedLayers.length === 0) {
        return;
      }

      await Promise.all(
        changedLayers.map(async (candidateLayer) => {
          const track = nextSelectedTracks[candidateLayer];
          if (!track) {
            return;
          }

          await audioEngine.setLayerLoop(
            candidateLayer,
            track.id,
            track.filename,
            state.layers[candidateLayer].volume,
          );
        })
      );

      set((current) => ({
        layers: {
          ...current.layers,
          ...Object.fromEntries(
            changedLayers.map((candidateLayer) => [
              candidateLayer,
              {
                ...current.layers[candidateLayer],
                currentLoopId: nextSelectedTracks[candidateLayer]?.id ?? null,
              },
            ])
          ),
        },
      }));

      logger.info('Layer loop updated', { layer, loopId, changedLayers });
    } catch (error) {
      logger.error('Failed to set layer loop', { layer, loopId, error });
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
