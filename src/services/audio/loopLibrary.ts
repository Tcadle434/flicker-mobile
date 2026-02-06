import type { AudioLayer, ModeManifest, SoundscapeMode } from '../../types';
import type { LayerConfig } from './nativeAudioModule';
import { getModeManifest } from './manifestLoader';
import { selectLoopId } from './loopSelector';

const LAYERS: AudioLayer[] = ['ambient', 'nature', 'melody', 'rhythm', 'synthesis'];

const DEFAULT_MIX: Record<AudioLayer, number> = {
  ambient: 0.7,
  nature: 0.5,
  melody: 0.0,
  rhythm: 0.0,
  synthesis: 0.3,
};

const TEST_FILENAME = 'test.wav';

const isTestLoop = (loopId?: string) => {
  if (!loopId) return true;
  return loopId === 'test' || loopId.startsWith('test_');
};

const resolveFilename = (loopId?: string) => {
  if (isTestLoop(loopId)) {
    return TEST_FILENAME;
  }

  if (loopId && loopId.includes('.')) {
    return loopId;
  }

  return `${loopId}.wav`;
};

const mapLayerToNative = (layer: AudioLayer) => (layer === 'synthesis' ? 'binaural' : layer);

export function buildLayerConfigs(mode: SoundscapeMode): LayerConfig[] {
  const manifest = getModeManifest(mode);
  return LAYERS.map((layer) => buildLayerConfig(manifest, layer));
}

function buildLayerConfig(manifest: ModeManifest, layer: AudioLayer): LayerConfig {
  const loopId = selectLoopId(manifest, layer);
  const filename = resolveFilename(loopId);
  const volume = manifest.defaultMix?.[layer] ?? DEFAULT_MIX[layer];

  return {
    layer: mapLayerToNative(layer),
    loopId,
    filename,
    volume,
  };
}
