import { useEffect, useRef } from 'react';
import { PERF_DIAGNOSTICS } from '../config/appConfig';
import { logger } from './logger';

type PerfCounterName =
  | 'activeFrameClocks'
  | 'activeIntervals'
  | 'activeWanderTimers'
  | 'adaptiveLoopTickCount';

const perfCounters: Record<PerfCounterName, number> = {
  activeFrameClocks: 0,
  activeIntervals: 0,
  activeWanderTimers: 0,
  adaptiveLoopTickCount: 0,
};

const renderCounts = new Map<string, number>();

const logPerfEvent = (event: string, data?: Record<string, unknown>) => {
  if (!PERF_DIAGNOSTICS) {
    return;
  }

  logger.debug(`[perf] ${event}`, data);
};

export const perfDiagnosticsEnabled = PERF_DIAGNOSTICS;

export const perfMark = (event: string, data?: Record<string, unknown>) => {
  logPerfEvent(event, data);
};

export const adjustPerfCounter = (name: PerfCounterName, delta: number) => {
  if (!PERF_DIAGNOSTICS) {
    return;
  }

  perfCounters[name] = Math.max(0, perfCounters[name] + delta);
  logPerfEvent(`counter:${name}`, { value: perfCounters[name], delta });
};

export const incrementPerfCounter = (name: PerfCounterName) => {
  adjustPerfCounter(name, 1);
};

export const decrementPerfCounter = (name: PerfCounterName) => {
  adjustPerfCounter(name, -1);
};

export const getPerfCounters = () => ({
  ...perfCounters,
});

export const useRenderDiagnostics = (name: string) => {
  const renderCountRef = useRef(0);

  renderCountRef.current += 1;

  if (PERF_DIAGNOSTICS) {
    renderCounts.set(name, renderCountRef.current);
    if (renderCountRef.current <= 3 || renderCountRef.current % 25 === 0) {
      logPerfEvent(`render:${name}`, { count: renderCountRef.current });
    }
  }

  useEffect(() => {
    logPerfEvent(`mount:${name}`);
    return () => {
      logPerfEvent(`unmount:${name}`, {
        renders: renderCounts.get(name) ?? renderCountRef.current,
      });
    };
  }, [name]);
};
