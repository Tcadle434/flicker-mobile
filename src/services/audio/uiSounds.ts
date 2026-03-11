/**
 * UI Sounds
 *
 * Lightweight one-shot sound effects for button presses and UI events.
 * Uses expo-audio's createAudioPlayer (non-hook API).
 * Players are cached after first use for instant replay.
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';
import { useAudioSettingsStore } from '../../stores/audioSettingsStore';

const SOUNDS = {
  buttonPress: require('../../../assets/audio/ui_sounds/button_press.mp3'),
  shopOpen: require('../../../assets/audio/ui_sounds/shop_open.mp3'),
  dialogueContinue: require('../../../assets/audio/ui_sounds/dialogue_continue_press.mp3'),
} as const;

type SoundName = keyof typeof SOUNDS;

const cache = new Map<SoundName, AudioPlayer>();

// Configure audio session so sounds play even in silent mode
let audioModeConfigured = false;
async function ensureAudioMode() {
  if (audioModeConfigured) return;
  audioModeConfigured = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
    });
  } catch (e) {
    console.warn('[uiSounds] Failed to set audio mode', e);
  }
}

function getPlayer(name: SoundName): AudioPlayer {
  let player = cache.get(name);
  if (!player) {
    player = createAudioPlayer(SOUNDS[name]);
    cache.set(name, player);
  }
  return player;
}

export function playSound(name: SoundName): void {
  try {
    if (useAudioSettingsStore.getState().isMuted) return;
    ensureAudioMode();
    const player = getPlayer(name);
    player.seekTo(0);
    player.play();
  } catch (e) {
    console.warn('[uiSounds] Failed to play', name, e);
  }
}
