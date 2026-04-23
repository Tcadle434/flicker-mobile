import { useCallback, useEffect, useRef } from 'react';
import {
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import {
  decrementPerfCounter,
  incrementPerfCounter,
  perfMark,
} from '../../lib/perfDiagnostics';

const DIRECTIONS: Array<readonly [number, number, Direction]> = [
  [0, 1, 'south'],
  [0, -1, 'north'],
  [1, 0, 'east'],
  [-1, 0, 'west'],
];

export type Direction = 'south' | 'north' | 'east' | 'west';

export interface GridWanderOptions {
  isWalkableTile: (col: number, row: number) => boolean;
  maxStepDistance?: number;
  idleRangeMs?: readonly [number, number];
  msPerTile?: number;
  initialFacing?: Direction;
  enabled?: boolean;
}

export interface GridWanderResult {
  tileX: SharedValue<number>;
  tileY: SharedValue<number>;
  isMoving: SharedValue<boolean>;
  facing: SharedValue<Direction>;
}

export default function useGridWander(
  startTileX: number,
  startTileY: number,
  {
    isWalkableTile,
    maxStepDistance = 5,
    idleRangeMs = [1000, 3000],
    msPerTile = 800,
    initialFacing = 'south',
    enabled = true,
  }: GridWanderOptions,
): GridWanderResult {
  const tileX = useSharedValue(startTileX);
  const tileY = useSharedValue(startTileY);
  const isMoving = useSharedValue(false);
  const facing = useSharedValue<Direction>(initialFacing);

  const idleMinMs = idleRangeMs[0] ?? 0;
  const idleMaxMs = idleRangeMs[1] ?? idleMinMs;

  const currentTile = useRef({ x: startTileX, y: startTileY });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTrackedRef = useRef(false);

  const clearScheduledMove = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      if (timeoutTrackedRef.current) {
        timeoutTrackedRef.current = false;
        decrementPerfCounter('activeWanderTimers');
        perfMark('wander-timer:stop');
      }
    }
  }, []);

  const scheduleTrackedTimeout = useCallback(
    (callback: () => void, delayMs: number) => {
      clearScheduledMove();
      timeoutTrackedRef.current = true;
      incrementPerfCounter('activeWanderTimers');
      perfMark('wander-timer:start', { delayMs });
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (timeoutTrackedRef.current) {
          timeoutTrackedRef.current = false;
          decrementPerfCounter('activeWanderTimers');
          perfMark('wander-timer:stop');
        }
        callback();
      }, delayMs);
    },
    [clearScheduledMove],
  );

  const scheduleNext = useCallback(() => {
    if (!enabled) {
      return;
    }

    const idleMs = idleMinMs + Math.random() * Math.max(0, idleMaxMs - idleMinMs);

    scheduleTrackedTimeout(() => {
      if (!enabled) {
        return;
      }

      const dirs = [...DIRECTIONS];
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }

      for (const [dx, dy, nextFacing] of dirs) {
        let maxDistance = 0;

        for (let distance = 1; distance <= maxStepDistance; distance++) {
          const candidateX = currentTile.current.x + dx * distance;
          const candidateY = currentTile.current.y + dy * distance;

          if (isWalkableTile(Math.round(candidateX), Math.round(candidateY))) {
            maxDistance = distance;
          } else {
            break;
          }
        }

        if (maxDistance === 0) continue;

        const walkDistance = 1 + Math.floor(Math.random() * maxDistance);
        const targetX = currentTile.current.x + dx * walkDistance;
        const targetY = currentTile.current.y + dy * walkDistance;
        const duration = walkDistance * msPerTile;

        currentTile.current = { x: targetX, y: targetY };
        isMoving.value = true;
        facing.value = nextFacing;

        tileX.value = withTiming(targetX, { duration, easing: Easing.linear });
        tileY.value = withTiming(targetY, { duration, easing: Easing.linear });

        scheduleTrackedTimeout(() => {
          isMoving.value = false;
          scheduleNext();
        }, duration);
        return;
      }

      scheduleNext();
    }, idleMs);
  }, [
    enabled,
    idleMaxMs,
    idleMinMs,
    isMoving,
    facing,
    tileX,
    tileY,
    maxStepDistance,
    msPerTile,
    isWalkableTile,
    scheduleTrackedTimeout,
  ]);

  useEffect(() => {
    clearScheduledMove();
    currentTile.current = { x: startTileX, y: startTileY };
    tileX.value = startTileX;
    tileY.value = startTileY;
    isMoving.value = false;
    facing.value = initialFacing;

    if (enabled) {
      scheduleNext();
    }

    return () => {
      clearScheduledMove();
    };
  }, [
    clearScheduledMove,
    enabled,
    facing,
    initialFacing,
    isMoving,
    scheduleNext,
    startTileX,
    startTileY,
    tileX,
    tileY,
  ]);

  return { tileX, tileY, isMoving, facing };
}
