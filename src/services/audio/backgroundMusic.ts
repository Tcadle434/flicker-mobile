/**
 * Background Music Service
 *
 * Imperative singleton that plays looping ambient music throughout the app.
 * Pauses during sessions, mutes via volume=0 (so position keeps advancing).
 */

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioPlayer } from 'expo-audio';

const VOLUME = 0.3;
let player: AudioPlayer | null = null;
let starting = false;

export async function startBackgroundMusic(muted: boolean): Promise<void> {
  if (player || starting) return;
  starting = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    player = createAudioPlayer(require('../../../assets/audio/main_app_background_music.m4a'));
    player.loop = true;
    player.volume = muted ? 0 : VOLUME;
    player.play();
  } catch (e) {
    console.warn('[backgroundMusic] Failed to start', e);
  } finally {
    starting = false;
  }
}

export function pauseBackgroundMusic(): void {
  try {
    // Silence via volume instead of player.pause() to avoid expo-audio
    // deactivating the shared AVAudioSession (which kills the native engine).
    if (player) player.volume = 0;
  } catch (e) {
    console.warn('[backgroundMusic] Failed to pause', e);
  }
}

export function resumeBackgroundMusic(): void {
  try {
    if (player) player.volume = VOLUME;
  } catch (e) {
    console.warn('[backgroundMusic] Failed to resume', e);
  }
}

export function muteBackgroundMusic(): void {
  try {
    if (player) player.volume = 0;
  } catch (e) {
    console.warn('[backgroundMusic] Failed to mute', e);
  }
}

export function unmuteBackgroundMusic(): void {
  try {
    if (player) player.volume = VOLUME;
  } catch (e) {
    console.warn('[backgroundMusic] Failed to unmute', e);
  }
}
