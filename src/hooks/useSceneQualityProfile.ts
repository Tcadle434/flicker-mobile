import { useEffect, useMemo, useState } from 'react';
import { AppState, type AppStateStatus, Platform } from 'react-native';
import NativeAudioEngine, { type PerformanceState } from '../services/audio/nativeAudioModule';
import type { SceneQualityProfile } from '../types';

const PERFORMANCE_POLL_MS = 30_000;

const DEFAULT_PERFORMANCE_STATE: PerformanceState = {
  thermalState: 'unknown',
  lowPowerModeEnabled: false,
};

function resolveQualityProfile(
  active: boolean,
  performanceState: PerformanceState,
): SceneQualityProfile {
  if (!active) {
    return 'paused';
  }

  if (performanceState.lowPowerModeEnabled) {
    return 'reduced';
  }

  switch (performanceState.thermalState) {
    case 'serious':
    case 'critical':
      return 'reduced';
    default:
      return 'full';
  }
}

export function useSceneQualityProfile(active: boolean): SceneQualityProfile {
  const [performanceState, setPerformanceState] = useState<PerformanceState>(DEFAULT_PERFORMANCE_STATE);

  useEffect(() => {
    if (!active || Platform.OS !== 'ios') {
      return;
    }

    let mounted = true;

    const refreshPerformanceState = async () => {
      try {
        const nextState = await NativeAudioEngine.getPerformanceState();
        if (mounted) {
          setPerformanceState(nextState);
        }
      } catch {
        if (mounted) {
          setPerformanceState(DEFAULT_PERFORMANCE_STATE);
        }
      }
    };

    void refreshPerformanceState();

    const interval = setInterval(() => {
      void refreshPerformanceState();
    }, PERFORMANCE_POLL_MS);

    const appStateSub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshPerformanceState();
      }
    });

    return () => {
      mounted = false;
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [active]);

  return useMemo(
    () => resolveQualityProfile(active, performanceState),
    [active, performanceState],
  );
}
