import { useEffect, useMemo, useRef } from 'react';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { decrementPerfCounter, incrementPerfCounter, perfMark } from '../lib/perfDiagnostics';

interface UseSceneClockOptions {
  active: boolean;
  label: string;
  maxFps?: number;
}

export function useSceneClock({
  active,
  label,
  maxFps = 30,
}: UseSceneClockOptions): SharedValue<number> {
  const clock = useSharedValue(0);
  const accumulator = useSharedValue(0);
  const stepMs = useMemo(() => (maxFps > 0 ? 1000 / maxFps : 0), [maxFps]);
  const countedRef = useRef(false);

  const frameCallback = useFrameCallback((info) => {
    if (info.timeSincePreviousFrame == null) {
      return;
    }

    if (stepMs <= 0) {
      clock.value += info.timeSincePreviousFrame / 1000;
      return;
    }

    accumulator.value += info.timeSincePreviousFrame;
    if (accumulator.value < stepMs) {
      return;
    }

    const elapsedMs = Math.floor(accumulator.value / stepMs) * stepMs;
    accumulator.value -= elapsedMs;
    clock.value += elapsedMs / 1000;
  }, false);

  useEffect(() => {
    frameCallback.setActive(active);

    if (active && !countedRef.current) {
      countedRef.current = true;
      incrementPerfCounter('activeFrameClocks');
      perfMark(`scene-clock:${label}:start`, { maxFps });
    } else if (!active && countedRef.current) {
      countedRef.current = false;
      decrementPerfCounter('activeFrameClocks');
      perfMark(`scene-clock:${label}:stop`);
    }

    if (!active) {
      accumulator.value = 0;
    }

    return () => {
      frameCallback.setActive(false);
      if (countedRef.current) {
        countedRef.current = false;
        decrementPerfCounter('activeFrameClocks');
        perfMark(`scene-clock:${label}:stop`);
      }
    };
  }, [accumulator, active, frameCallback, label, maxFps]);

  return clock;
}
