import type {
  AudioLayer,
  AudioTrackOption,
  ResetSessionAudioMode,
} from '../../types';
import {
  AUDIO_LAYERS,
  DEFAULT_MIX,
  buildLayerConfigs,
  getModeTrackCatalog,
  getSelectedTracks,
  mapLayerToNative,
} from './loopLibrary';
import { getModeManifest } from './manifestLoader';
import type { LayerConfig } from './nativeAudioModule';

type LoopSelectionMap = Partial<Record<AudioLayer, string | null>>;
type VolumeMap = Partial<Record<AudioLayer, number>>;

export interface ResetSessionAudioProfile {
  id: ResetSessionAudioMode;
  label: string;
  activeLayers: AudioLayer[];
  standaloneLayer?: AudioLayer;
  tracksByLayer: Record<AudioLayer, AudioTrackOption[]>;
  defaultVolumes: Partial<Record<AudioLayer, number>>;
  showFullMixer: boolean;
  showStandaloneVolumeControl: boolean;
  adaptiveBehavior: boolean;
}

const RESET_SESSION_AUDIO_MODE_ORDER: ResetSessionAudioMode[] = [
  'custom',
  '432hz',
  'binauralBeats',
];

const createEmptyTrackCatalog = (): Record<AudioLayer, AudioTrackOption[]> => ({
  ambient: [],
  nature: [],
  melody: [],
  rhythm: [],
  synthesis: [],
});

const createStandaloneCatalog = (
  layer: AudioLayer,
  tracks: AudioTrackOption[],
): Record<AudioLayer, AudioTrackOption[]> => {
  const catalog = createEmptyTrackCatalog();
  catalog[layer] = tracks;
  return catalog;
};

const STANDALONE_432_TRACKS: AudioTrackOption[] = [
  {
    id: '432Hz_1.mp3',
    filename: '432Hz_1.mp3',
    label: '432Hz 1',
    layer: 'ambient',
  },
];

const BINAURAL_BEAT_TRACKS: AudioTrackOption[] = [
  {
    id: 'binaural_beats_1.mp3',
    filename: 'binaural_beats_1.mp3',
    label: 'Binaural Beat 1',
    layer: 'synthesis',
  },
];

const resolveSelectedTrack = (
  tracks: AudioTrackOption[],
  selectedLoopId?: string | null,
): AudioTrackOption | null => {
  if (tracks.length === 0) {
    return null;
  }

  if (!selectedLoopId) {
    return tracks[0];
  }

  return tracks.find((track) => track.id === selectedLoopId) ?? tracks[0];
};

const getCustomProfile = (): ResetSessionAudioProfile => {
  const manifest = getModeManifest('relax');

  return {
    id: 'custom',
    label: 'Custom',
    activeLayers: ['ambient', 'nature', 'melody'],
    tracksByLayer: getModeTrackCatalog('relax'),
    defaultVolumes: {
      ambient: manifest.defaultMix?.ambient ?? DEFAULT_MIX.ambient,
      nature: manifest.defaultMix?.nature ?? DEFAULT_MIX.nature,
      melody: manifest.defaultMix?.melody ?? DEFAULT_MIX.melody,
      rhythm: manifest.defaultMix?.rhythm ?? DEFAULT_MIX.rhythm,
      synthesis: manifest.defaultMix?.synthesis ?? DEFAULT_MIX.synthesis,
    },
    showFullMixer: true,
    showStandaloneVolumeControl: false,
    adaptiveBehavior: true,
  };
};

const get432HzProfile = (): ResetSessionAudioProfile => ({
  id: '432hz',
  label: '432Hz',
  activeLayers: ['ambient'],
  standaloneLayer: 'ambient',
  tracksByLayer: createStandaloneCatalog('ambient', STANDALONE_432_TRACKS),
  defaultVolumes: {
    ambient: 0.5,
  },
  showFullMixer: false,
  showStandaloneVolumeControl: true,
  adaptiveBehavior: false,
});

const getBinauralBeatsProfile = (): ResetSessionAudioProfile => ({
  id: 'binauralBeats',
  label: 'Binaural Beats',
  activeLayers: ['synthesis'],
  standaloneLayer: 'synthesis',
  tracksByLayer: createStandaloneCatalog('synthesis', BINAURAL_BEAT_TRACKS),
  defaultVolumes: {
    synthesis: 0.5,
  },
  showFullMixer: false,
  showStandaloneVolumeControl: true,
  adaptiveBehavior: false,
});

export function getResetSessionAudioProfile(
  mode: ResetSessionAudioMode,
): ResetSessionAudioProfile {
  switch (mode) {
    case '432hz':
      return get432HzProfile();
    case 'binauralBeats':
      return getBinauralBeatsProfile();
    case 'custom':
    default:
      return getCustomProfile();
  }
}

export function getResetSessionTrackCatalog(
  mode: ResetSessionAudioMode,
): Record<AudioLayer, AudioTrackOption[]> {
  return getResetSessionAudioProfile(mode).tracksByLayer;
}

export function getResetSessionSelectedTracks(
  mode: ResetSessionAudioMode,
  selectedLoopIds: LoopSelectionMap = {},
): Record<AudioLayer, AudioTrackOption | null> {
  if (mode === 'custom') {
    return getSelectedTracks('relax', selectedLoopIds);
  }

  const catalog = getResetSessionTrackCatalog(mode);

  return Object.fromEntries(
    AUDIO_LAYERS.map((layer) => [
      layer,
      resolveSelectedTrack(catalog[layer], selectedLoopIds[layer]),
    ])
  ) as Record<AudioLayer, AudioTrackOption | null>;
}

export function buildResetSessionLayerConfigs(
  mode: ResetSessionAudioMode,
  selectedLoopIds: LoopSelectionMap = {},
  volumes: VolumeMap = {},
): LayerConfig[] {
  if (mode === 'custom') {
    return buildLayerConfigs('relax', selectedLoopIds, volumes);
  }

  const profile = getResetSessionAudioProfile(mode);
  const selectedTracks = getResetSessionSelectedTracks(mode, selectedLoopIds);

  return profile.activeLayers.flatMap((layer) => {
    const track = selectedTracks[layer];
    if (!track) {
      return [];
    }

    return [
      {
        layer: mapLayerToNative(layer),
        loopId: track.id,
        filename: track.filename,
        volume: volumes[layer] ?? profile.defaultVolumes[layer] ?? DEFAULT_MIX[layer],
      },
    ];
  });
}

export function getResetSessionDefaultSelections(
  mode: ResetSessionAudioMode,
): LoopSelectionMap {
  const selectedTracks = getResetSessionSelectedTracks(mode);

  return Object.fromEntries(
    AUDIO_LAYERS.map((layer) => [layer, selectedTracks[layer]?.id ?? null])
  ) as LoopSelectionMap;
}

export function getResetSessionDefaultVolumes(
  mode: ResetSessionAudioMode,
): VolumeMap {
  const profile = getResetSessionAudioProfile(mode);

  return Object.fromEntries(
    AUDIO_LAYERS.map((layer) => [
      layer,
      profile.defaultVolumes[layer] ?? DEFAULT_MIX[layer],
    ])
  ) as VolumeMap;
}

export function getInitialResetSessionSelections(): Record<
  ResetSessionAudioMode,
  LoopSelectionMap
> {
  return Object.fromEntries(
    RESET_SESSION_AUDIO_MODE_ORDER.map((mode) => [mode, getResetSessionDefaultSelections(mode)])
  ) as Record<ResetSessionAudioMode, LoopSelectionMap>;
}

export function getInitialResetSessionVolumes(): Record<
  ResetSessionAudioMode,
  VolumeMap
> {
  return Object.fromEntries(
    RESET_SESSION_AUDIO_MODE_ORDER.map((mode) => [mode, getResetSessionDefaultVolumes(mode)])
  ) as Record<ResetSessionAudioMode, VolumeMap>;
}

export function isStandaloneResetSessionAudioMode(
  mode: ResetSessionAudioMode,
): boolean {
  return Boolean(getResetSessionAudioProfile(mode).standaloneLayer);
}

export function getResetSessionStandaloneLayer(
  mode: ResetSessionAudioMode,
): AudioLayer | null {
  return getResetSessionAudioProfile(mode).standaloneLayer ?? null;
}
