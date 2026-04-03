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
import {
  buildResetSessionLayerConfigs,
  getInitialResetSessionSelections,
  getInitialResetSessionVolumes,
  getResetSessionAudioProfile,
  getResetSessionSelectedTracks,
  getResetSessionStandaloneLayer,
  getResetSessionTrackCatalog,
} from '../services/audio/resetSessionAudioProfiles';
import { AdaptiveController } from '../integration/AdaptiveController';
import { logger } from '../lib/logger';
import type {
  AudioLayer,
  PlayerState,
  ResetSessionAudioMode,
  SoundscapeMode,
} from '../types';

interface PlayerStore extends PlayerState {
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
  resetResetSessionAudioState: () => void;
  setResetSessionAudioMode: (mode: ResetSessionAudioMode) => Promise<void>;
  cycleResetSessionStandaloneTrack: (direction: -1 | 1) => Promise<void>;
  setResetSessionStandaloneVolume: (volume: number) => void;
}

const audioEngine = getNativeAudioBridge();
const adaptiveController = new AdaptiveController();
let adaptiveInterval: ReturnType<typeof setInterval> | null = null;
let adaptiveUpdateInFlight = false;

type LoopSelectionMap = Partial<Record<AudioLayer, string | null>>;
type VolumeMap = Partial<Record<AudioLayer, number>>;

const KEY_LOCKED_LAYERS: AudioLayer[] = ['ambient', 'melody'];

const defaultAdaptiveInputs = {
  timeOfDay: getTimeOfDayInput(),
  weather: null,
  heartRate: null,
  season: getSeason(),
};

const defaultAdaptiveParameters = mapAdaptiveParameters(defaultAdaptiveInputs, 10);

const createInitialResetSessionState = () => ({
  resetSessionAudioMode: 'custom' as ResetSessionAudioMode,
  resetSessionSelections: getInitialResetSessionSelections(),
  resetSessionVolumes: getInitialResetSessionVolumes(),
});

const getPartnerLayer = (layer: AudioLayer): AudioLayer | null => {
  if (layer === 'ambient') return 'melody';
  if (layer === 'melody') return 'ambient';
  return null;
};

const areTracksCompatible = (currentKey?: string, partnerKey?: string) =>
  !currentKey || !partnerKey || currentKey === partnerKey;

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

const buildResetSessionLayerState = (
  currentLayers: PlayerState['layers'],
  resetSessionAudioMode: ResetSessionAudioMode,
  loopSelections: LoopSelectionMap = {},
  volumeOverrides: VolumeMap = {},
) => {
  const profile = getResetSessionAudioProfile(resetSessionAudioMode);
  const trackCatalog = getResetSessionTrackCatalog(resetSessionAudioMode);
  const selectedTracks = getResetSessionSelectedTracks(resetSessionAudioMode, loopSelections);
  const layerConfigs = buildResetSessionLayerConfigs(
    resetSessionAudioMode,
    loopSelections,
    volumeOverrides,
  );

  return {
    layerConfigs,
    layers: Object.fromEntries(
      AUDIO_LAYERS.map((layer) => [
        layer,
        {
          ...currentLayers[layer],
          currentLoopId: selectedTracks[layer]?.id ?? null,
          availableTracks: trackCatalog[layer],
          volume:
            volumeOverrides[layer] ??
            profile.defaultVolumes[layer] ??
            currentLayers[layer].volume ??
            DEFAULT_MIX[layer],
        },
      ])
    ) as PlayerState['layers'],
  };
};

const buildPlaybackLayerState = (
  state: Pick<
    PlayerState,
    'layers' | 'mode' | 'resetSessionAudioMode' | 'resetSessionSelections' | 'resetSessionVolumes'
  >,
  modeOverride: SoundscapeMode = state.mode,
) => {
  if (modeOverride === 'relax') {
    const resetSessionAudioMode = state.resetSessionAudioMode;
    return buildResetSessionLayerState(
      state.layers,
      resetSessionAudioMode,
      state.resetSessionSelections[resetSessionAudioMode],
      state.resetSessionVolumes[resetSessionAudioMode],
    );
  }

  return buildModeLayerState(
    state.layers,
    modeOverride,
    getLayerSelections(state.layers),
    getLayerVolumes(state.layers),
  );
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

const shouldApplyAdaptiveBehavior = (state: PlayerState) => {
  if (!state.adaptiveEnabled) {
    return false;
  }

  if (state.mode !== 'relax') {
    return true;
  }

  return getResetSessionAudioProfile(state.resetSessionAudioMode).adaptiveBehavior;
};

const applyAdaptiveParametersIfNeeded = async (state: PlayerState) => {
  if (!shouldApplyAdaptiveBehavior(state)) {
    return;
  }

  await audioEngine.updateAdaptiveParameters(state.adaptiveParameters);
};

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
  ...createInitialResetSessionState(),

  initialize: async () => {
    try {
      logger.info('Initializing audio engine from playerStore...');
      set({ playbackState: 'loading' });

      await audioEngine.initialize();

      const nextState = buildPlaybackLayerState(get());
      await audioEngine.loadMode(get().mode, get().adaptiveParameters, nextState.layerConfigs);
      set({ layers: nextState.layers });
      syncNativeMutes(get().layers);
      await applyAdaptiveParametersIfNeeded(get());
      startAdaptiveLoop(set, get);

      set({ playbackState: 'idle' });
      logger.info('Audio engine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize audio engine', error);
      set({ playbackState: 'error' });
      throw error;
    }
  },

  setMode: async (mode: SoundscapeMode) => {
    try {
      logger.info('Changing mode', { mode });
      set({ playbackState: 'loading' });

      const current = get();
      const nextState = buildPlaybackLayerState(current, mode);
      await audioEngine.loadMode(mode, current.adaptiveParameters, nextState.layerConfigs);
      set({ mode, layers: nextState.layers });
      syncNativeMutes(get().layers);
      await applyAdaptiveParametersIfNeeded(get());
      startAdaptiveLoop(set, get);

      set({ playbackState: 'idle' });
      logger.info('Mode changed successfully', { mode });
    } catch (error) {
      logger.error('Failed to change mode', { mode, error });
      set({ playbackState: 'error' });
      throw error;
    }
  },

  play: async () => {
    try {
      let didInitialize = false;

      if (!audioEngine.isReady()) {
        await get().initialize();
        didInitialize = true;
      }

      const state = get();

      if (!didInitialize && state.playbackState === 'idle') {
        const nextState = buildPlaybackLayerState(state);
        await audioEngine.loadMode(state.mode, state.adaptiveParameters, nextState.layerConfigs);
        set({ layers: nextState.layers });
        syncNativeMutes(get().layers);
        await applyAdaptiveParametersIfNeeded(get());
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

  pause: () => {
    try {
      logger.info('Pausing playback');
      audioEngine.pause();
      set({ playbackState: 'paused' });
    } catch (error) {
      logger.error('Failed to pause playback', error);
    }
  },

  stop: () => {
    try {
      logger.info('Stopping playback');
      audioEngine.stop();
      set({ playbackState: 'idle' });
    } catch (error) {
      logger.error('Failed to stop playback', error);
    }
  },

  setLayerLoop: async (layer: AudioLayer, loopId: string) => {
    try {
      const state = get();

      if (state.mode === 'relax' && state.resetSessionAudioMode !== 'custom') {
        const standaloneLayer = getResetSessionStandaloneLayer(state.resetSessionAudioMode);
        if (!standaloneLayer || layer !== standaloneLayer) {
          return;
        }

        const trackCatalog = getResetSessionTrackCatalog(state.resetSessionAudioMode);
        const track = trackCatalog[layer].find((candidate) => candidate.id === loopId);
        if (!track) {
          return;
        }

        await audioEngine.setLayerLoop(layer, track.id, track.filename, state.layers[layer].volume);

        set((current) => ({
          layers: {
            ...current.layers,
            [layer]: {
              ...current.layers[layer],
              currentLoopId: track.id,
              availableTracks: trackCatalog[layer],
            },
          },
          resetSessionSelections: {
            ...current.resetSessionSelections,
            [current.resetSessionAudioMode]: {
              ...current.resetSessionSelections[current.resetSessionAudioMode],
              [layer]: track.id,
            },
          },
        }));

        logger.info('Standalone layer loop updated', { layer, loopId });
        return;
      }

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
        resetSessionSelections:
          current.mode === 'relax' && current.resetSessionAudioMode === 'custom'
            ? {
                ...current.resetSessionSelections,
                custom: {
                  ...current.resetSessionSelections.custom,
                  ...Object.fromEntries(
                    changedLayers.map((candidateLayer) => [
                      candidateLayer,
                      nextSelectedTracks[candidateLayer]?.id ?? null,
                    ])
                  ),
                },
              }
            : current.resetSessionSelections,
      }));

      logger.info('Layer loop updated', { layer, loopId, changedLayers });
    } catch (error) {
      logger.error('Failed to set layer loop', { layer, loopId, error });
    }
  },

  setLayerVolume: (layer: AudioLayer, volume: number) => {
    try {
      audioEngine.setLayerVolume(layer, volume, 0.1);
      if (volume > 0.001) {
        audioEngine.setLayerMuted(layer, false);
      }

      set((state) => {
        const standaloneLayer = getResetSessionStandaloneLayer(state.resetSessionAudioMode);
        const shouldSyncStandaloneVolume =
          state.mode === 'relax' &&
          state.resetSessionAudioMode !== 'custom' &&
          standaloneLayer === layer;

        return {
          layers: {
            ...state.layers,
            [layer]: {
              ...state.layers[layer],
              volume,
              muted: volume > 0.001 ? false : state.layers[layer].muted,
            },
          },
          resetSessionVolumes:
            state.mode === 'relax' && state.resetSessionAudioMode === 'custom'
              ? {
                  ...state.resetSessionVolumes,
                  custom: {
                    ...state.resetSessionVolumes.custom,
                    [layer]: volume,
                  },
                }
              : shouldSyncStandaloneVolume
                ? {
                    ...state.resetSessionVolumes,
                    [state.resetSessionAudioMode]: {
                      ...state.resetSessionVolumes[state.resetSessionAudioMode],
                      [layer]: volume,
                    },
                  }
                : state.resetSessionVolumes,
        };
      });

      logger.debug('Layer volume updated', { layer, volume });
    } catch (error) {
      logger.error('Failed to set layer volume', { layer, volume, error });
    }
  },

  setMasterVolume: (volume: number) => {
    try {
      audioEngine.setMasterVolume(volume, 0.1);
      set({ masterVolume: volume });
      logger.debug('Master volume updated', { volume });
    } catch (error) {
      logger.error('Failed to set master volume', { volume, error });
    }
  },

  setLayerMuted: (layer: AudioLayer, muted: boolean) => {
    try {
      audioEngine.setLayerMuted(layer, muted, 0.1);

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

  toggleAdaptive: () => {
    set((state) => {
      const newEnabled = !state.adaptiveEnabled;
      logger.info('Adaptive mode toggled', { enabled: newEnabled });
      return { adaptiveEnabled: newEnabled };
    });
  },

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

      if (!shouldApplyAdaptiveBehavior({ ...state, adaptiveParameters: parameters })) {
        logger.debug('Adaptive behavior bypassed for current reset session audio mode');
        return;
      }

      await audioEngine.updateAdaptiveParameters(parameters);

      logger.info('Adaptive parameters updated', { parameters });
    } catch (error) {
      logger.error('Failed to update adaptive parameters', error);
    }
  },

  resetResetSessionAudioState: () => {
    set(createInitialResetSessionState());
  },

  setResetSessionAudioMode: async (mode: ResetSessionAudioMode) => {
    try {
      const state = get();
      const nextSelections = {
        ...state.resetSessionSelections,
        [mode]: {
          ...getInitialResetSessionSelections()[mode],
          ...state.resetSessionSelections[mode],
        },
      };
      const nextVolumes = {
        ...state.resetSessionVolumes,
        [mode]: {
          ...getInitialResetSessionVolumes()[mode],
          ...state.resetSessionVolumes[mode],
        },
      };

      const nextState = buildResetSessionLayerState(
        state.layers,
        mode,
        nextSelections[mode],
        nextVolumes[mode],
      );

      if (state.mode === 'relax') {
        await audioEngine.loadLayerConfigs(`reset:${mode}`, nextState.layerConfigs);
      }

      set({
        resetSessionAudioMode: mode,
        resetSessionSelections: nextSelections,
        resetSessionVolumes: nextVolumes,
        layers: nextState.layers,
      });

      syncNativeMutes(get().layers);
      await applyAdaptiveParametersIfNeeded(get());

      logger.info('Reset session audio mode updated', { mode });
    } catch (error) {
      logger.error('Failed to set reset session audio mode', { mode, error });
    }
  },

  cycleResetSessionStandaloneTrack: async (direction: -1 | 1) => {
    try {
      const state = get();
      const standaloneLayer = getResetSessionStandaloneLayer(state.resetSessionAudioMode);
      if (!standaloneLayer) {
        return;
      }

      const trackCatalog = getResetSessionTrackCatalog(state.resetSessionAudioMode);
      const tracks = trackCatalog[standaloneLayer];
      if (tracks.length < 2) {
        return;
      }

      const currentLoopId =
        state.resetSessionSelections[state.resetSessionAudioMode][standaloneLayer] ??
        state.layers[standaloneLayer].currentLoopId;
      const currentIndex = tracks.findIndex((track) => track.id === currentLoopId);
      const startIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (startIndex + direction + tracks.length) % tracks.length;
      const nextTrack = tracks[nextIndex];
      if (!nextTrack) {
        return;
      }

      const volume =
        state.resetSessionVolumes[state.resetSessionAudioMode][standaloneLayer] ??
        state.layers[standaloneLayer].volume ??
        DEFAULT_MIX[standaloneLayer];

      await audioEngine.setLayerLoop(
        standaloneLayer,
        nextTrack.id,
        nextTrack.filename,
        volume,
      );

      set((current) => ({
        layers: {
          ...current.layers,
          [standaloneLayer]: {
            ...current.layers[standaloneLayer],
            currentLoopId: nextTrack.id,
            availableTracks: tracks,
          },
        },
        resetSessionSelections: {
          ...current.resetSessionSelections,
          [current.resetSessionAudioMode]: {
            ...current.resetSessionSelections[current.resetSessionAudioMode],
            [standaloneLayer]: nextTrack.id,
          },
        },
      }));

      logger.info('Reset session standalone track cycled', {
        mode: state.resetSessionAudioMode,
        layer: standaloneLayer,
        loopId: nextTrack.id,
      });
    } catch (error) {
      logger.error('Failed to cycle reset session standalone track', error);
    }
  },

  setResetSessionStandaloneVolume: (volume: number) => {
    try {
      const state = get();
      const standaloneLayer = getResetSessionStandaloneLayer(state.resetSessionAudioMode);
      if (!standaloneLayer) {
        return;
      }

      audioEngine.setLayerVolume(standaloneLayer, volume, 0.1);
      if (volume > 0.001) {
        audioEngine.setLayerMuted(standaloneLayer, false);
      }

      set((current) => ({
        layers: {
          ...current.layers,
          [standaloneLayer]: {
            ...current.layers[standaloneLayer],
            volume,
            muted: volume > 0.001 ? false : current.layers[standaloneLayer].muted,
          },
        },
        resetSessionVolumes: {
          ...current.resetSessionVolumes,
          [current.resetSessionAudioMode]: {
            ...current.resetSessionVolumes[current.resetSessionAudioMode],
            [standaloneLayer]: volume,
          },
        },
      }));

      logger.debug('Reset session standalone volume updated', {
        mode: state.resetSessionAudioMode,
        layer: standaloneLayer,
        volume,
      });
    } catch (error) {
      logger.error('Failed to set reset session standalone volume', { volume, error });
    }
  },
}));
