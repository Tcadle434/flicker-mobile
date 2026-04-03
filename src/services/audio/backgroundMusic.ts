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
let mutedByUser = false;
let suppressedBySession = false;

function applyPlayerState(): void {
  if (!player) return;

  const shouldSilence = mutedByUser || suppressedBySession;
  player.muted = shouldSilence;
  player.volume = shouldSilence ? 0 : VOLUME;
}

export async function startBackgroundMusic(muted: boolean): Promise<void> {
  if (player || starting) return;
  starting = true;
  try {
    mutedByUser = muted;
    await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    player = createAudioPlayer(require('../../../assets/audio/main_app_background_music.m4a'));
    player.loop = true;
    applyPlayerState();
    player.play();
  } catch (e) {
    console.warn('[backgroundMusic] Failed to start', e);
  } finally {
    starting = false;
  }
}

export function pauseBackgroundMusic(): void {
  try {
    suppressedBySession = true;
    applyPlayerState();
  } catch (e) {
    console.warn('[backgroundMusic] Failed to pause', e);
  }
}

export function resumeBackgroundMusic(): void {
  try {
    suppressedBySession = false;
    applyPlayerState();
  } catch (e) {
    console.warn('[backgroundMusic] Failed to resume', e);
  }
}

export function muteBackgroundMusic(): void {
  try {
    mutedByUser = true;
    applyPlayerState();
  } catch (e) {
    console.warn('[backgroundMusic] Failed to mute', e);
  }
}

export function unmuteBackgroundMusic(): void {
  try {
    mutedByUser = false;
    applyPlayerState();
  } catch (e) {
    console.warn('[backgroundMusic] Failed to unmute', e);
  }
}
