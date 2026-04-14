/**
 * Deprecated compatibility shim.
 * Runtime audio ownership now lives in audioCoordinator.
 */

import { audioCoordinator } from './audioCoordinator';

export async function startBackgroundMusic(muted: boolean): Promise<void> {
  await audioCoordinator.initialize();
  await audioCoordinator.setMuted(muted);
  await audioCoordinator.enterShell();
}

export function pauseBackgroundMusic(): void {
  void audioCoordinator.leaveShell();
}

export function resumeBackgroundMusic(): void {
  void audioCoordinator.enterShell();
}

export function muteBackgroundMusic(): void {
  void audioCoordinator.setMuted(true);
}

export function unmuteBackgroundMusic(): void {
  void audioCoordinator.setMuted(false);
}
