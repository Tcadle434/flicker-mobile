import type { AudioLayer, ModeManifest } from '../../types';

export function selectLoopId(manifest: ModeManifest, layer: AudioLayer): string {
  const loops = manifest.loops?.[layer];
  if (loops && loops.length > 0) {
    const index = Math.floor(Math.random() * loops.length);
    return loops[index];
  }
  return 'test';
}
