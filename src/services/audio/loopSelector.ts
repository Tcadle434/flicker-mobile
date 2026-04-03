import type {
  AudioLayer,
  AudioTrackOption,
  ManifestLoopTrack,
  ModeManifest,
} from '../../types';

const humanizeFilename = (filename: string) =>
  filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim();

const normalizeFilename = (filename: string) => {
  if (filename.includes('.')) {
    return filename;
  }

  return `${filename}.wav`;
};

const normalizeTrack = (
  loop: string | ManifestLoopTrack,
  layer: AudioLayer,
): AudioTrackOption => {
  if (typeof loop === 'string') {
    const filename = normalizeFilename(loop);
    return {
      id: filename,
      filename,
      label: humanizeFilename(filename),
      layer,
    };
  }

  const filename = normalizeFilename(loop.filename);
  return {
    id: filename,
    filename,
    label: loop.label,
    key: loop.key,
    layer,
  };
};

export function getManifestTracks(manifest: ModeManifest, layer: AudioLayer): AudioTrackOption[] {
  return (manifest.loops?.[layer] ?? []).map((loop) => normalizeTrack(loop, layer));
}

export function getDefaultTrack(manifest: ModeManifest, layer: AudioLayer): AudioTrackOption | null {
  return getManifestTracks(manifest, layer)[0] ?? null;
}
