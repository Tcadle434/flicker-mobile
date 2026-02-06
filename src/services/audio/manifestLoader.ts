import type { ModeManifest, SoundscapeMode } from '../../types';

const focusManifest: ModeManifest = require('../../../assets/audio/manifests/focus.json');
const relaxManifest: ModeManifest = require('../../../assets/audio/manifests/relax.json');
const sleepManifest: ModeManifest = require('../../../assets/audio/manifests/sleep.json');

const manifests: Partial<Record<SoundscapeMode, ModeManifest>> = {
  focus: focusManifest,
  relax: relaxManifest,
  sleep: sleepManifest,
};

export function getModeManifest(mode: SoundscapeMode): ModeManifest {
  const manifest = manifests[mode];
  if (manifest) {
    return manifest;
  }

  console.warn(`[ManifestLoader] Missing manifest for mode "${mode}", falling back to "focus".`);
  return focusManifest;
}
