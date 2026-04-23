/**
 * Deprecated compatibility shim.
 * Runtime audio ownership now lives in audioCoordinator.
 */

import { audioCoordinator } from './audioCoordinator';

export async function startBackgroundMusic(muted: boolean): Promise<void> {
  await audioCoordinator.setShellMuted(muted);
  await audioCoordinator.enterShell();
}

export function pauseBackgroundMusic(): void {
  void audioCoordinator.leaveShell();
}

export function resumeBackgroundMusic(): void {
  void audioCoordinator.enterShell();
}

export function muteBackgroundMusic(): void {
  void audioCoordinator.setShellMuted(true);
}

export function unmuteBackgroundMusic(): void {
  void audioCoordinator.setShellMuted(false);
}
