import { audioCoordinator } from './audioCoordinator';
import type { UiSoundName } from '../../types';

export function playSound(name: UiSoundName): void {
  void audioCoordinator.playUiSound(name).catch(() => undefined);
}
