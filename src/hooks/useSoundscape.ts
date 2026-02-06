import { useMemo } from 'react';
import { SoundscapeOrchestrator } from '../integration/SoundscapeOrchestrator';

export function useSoundscape() {
  const orchestrator = useMemo(() => new SoundscapeOrchestrator(), []);
  return orchestrator;
}
