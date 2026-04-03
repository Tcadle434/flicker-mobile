import type { AudioLayer, AudioTrackOption, ModeManifest, SoundscapeMode } from '../../types';
import type { LayerConfig } from './nativeAudioModule';
import { getModeManifest } from './manifestLoader';
import { getManifestTracks } from './loopSelector';

export const AUDIO_LAYERS: AudioLayer[] = ['ambient', 'nature', 'melody', 'rhythm', 'synthesis'];

export const DEFAULT_MIX: Record<AudioLayer, number> = {
  ambient: 0.7,
  nature: 0.5,
  melody: 0.0,
  rhythm: 0.0,
  synthesis: 0.3,
};

type LoopSelectionMap = Partial<Record<AudioLayer, string | null>>;
type VolumeMap = Partial<Record<AudioLayer, number>>;

const KEY_LOCKED_LAYERS: AudioLayer[] = ['ambient', 'melody'];

export const mapLayerToNative = (layer: AudioLayer) => (layer === 'synthesis' ? 'binaural' : layer);

const areTracksCompatible = (left: AudioTrackOption, right: AudioTrackOption) => {
  if (!left.key || !right.key) {
    return true;
  }

  return left.key === right.key;
};

const getPartnerLayer = (layer: AudioLayer): AudioLayer | null => {
  if (layer === 'ambient') return 'melody';
  if (layer === 'melody') return 'ambient';
  return null;
};

const filterCompatibleTracks = (
  tracks: AudioTrackOption[],
  partnerTracks: AudioTrackOption[],
): AudioTrackOption[] => {
  if (tracks.length === 0 || partnerTracks.length === 0) {
    return tracks;
  }

  const compatibleTracks = tracks.filter((track) =>
    partnerTracks.some((partnerTrack) => areTracksCompatible(track, partnerTrack))
  );

  return compatibleTracks.length > 0 ? compatibleTracks : tracks;
};

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

export function getModeTrackCatalog(mode: SoundscapeMode): Record<AudioLayer, AudioTrackOption[]> {
  const manifest = getModeManifest(mode);

  const rawCatalog = Object.fromEntries(
    AUDIO_LAYERS.map((layer) => [layer, getManifestTracks(manifest, layer)])
  ) as Record<AudioLayer, AudioTrackOption[]>;

  return Object.fromEntries(
    AUDIO_LAYERS.map((layer) => {
      if (!KEY_LOCKED_LAYERS.includes(layer)) {
        return [layer, rawCatalog[layer]];
      }

      const partnerLayer = getPartnerLayer(layer);
      if (!partnerLayer) {
        return [layer, rawCatalog[layer]];
      }

      return [layer, filterCompatibleTracks(rawCatalog[layer], rawCatalog[partnerLayer])];
    })
  ) as Record<AudioLayer, AudioTrackOption[]>;
}

export function getSelectedTracks(
  mode: SoundscapeMode,
  selectedLoopIds: LoopSelectionMap = {},
): Record<AudioLayer, AudioTrackOption | null> {
  const catalog = getModeTrackCatalog(mode);

  return Object.fromEntries(
    AUDIO_LAYERS.map((layer) => [layer, resolveSelectedTrack(catalog[layer], selectedLoopIds[layer])])
  ) as Record<AudioLayer, AudioTrackOption | null>;
}

export function buildLayerConfigs(
  mode: SoundscapeMode,
  selectedLoopIds: LoopSelectionMap = {},
  volumes: VolumeMap = {},
): LayerConfig[] {
  const manifest = getModeManifest(mode);
  const selectedTracks = getSelectedTracks(mode, selectedLoopIds);

  return AUDIO_LAYERS.flatMap((layer) => {
    const track = selectedTracks[layer];
    if (!track) {
      return [];
    }

    return [
      {
        layer: mapLayerToNative(layer),
        loopId: track.id,
        filename: track.filename,
        volume: volumes[layer] ?? manifest.defaultMix?.[layer] ?? DEFAULT_MIX[layer],
      },
    ];
  });
}
