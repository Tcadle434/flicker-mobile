import { useCallback, useEffect, useRef } from 'react';
import {
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { isWalkable } from '../../services/world/tiledMapLoader';

const DIRECTIONS: [number, number][] = [
  [0, 1],  // south
  [0, -1], // north
  [1, 0],  // east
  [-1, 0], // west
];

export type Direction = 'south' | 'north' | 'east' | 'west';

interface WanderResult {
  tileX: SharedValue<number>;
  tileY: SharedValue<number>;
  isMoving: SharedValue<boolean>;
  facing: SharedValue<Direction>;
}

export default function useFlickerWander(
  startTileX: number,
  startTileY: number,
): WanderResult {
  const tileX = useSharedValue(startTileX);
  const tileY = useSharedValue(startTileY);
  const isMoving = useSharedValue(false);
  const facing = useSharedValue<Direction>('south');

  const currentTile = useRef({ x: startTileX, y: startTileY });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const scheduleNext = useCallback(() => {
    // Idle for 1–3 seconds before next move
    const idleMs = 1000 + Math.random() * 2000;

    timeoutRef.current = setTimeout(() => {
      // Fisher-Yates shuffle for unbiased random direction
      const dirs = [...DIRECTIONS];
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }

      for (const [dx, dy] of dirs) {
        // Find how far we can walk in this direction (1–5 tiles)
        let maxDist = 0;
        for (let d = 1; d <= 5; d++) {
          const nx = currentTile.current.x + dx * d;
          const ny = currentTile.current.y + dy * d;
          if (isWalkable(Math.round(nx), Math.round(ny))) {
            maxDist = d;
          } else {
            break;
          }
        }

        if (maxDist === 0) continue;

        // Walk a random distance up to maxDist
        const walkDist = 1 + Math.floor(Math.random() * maxDist);
        const targetX = currentTile.current.x + dx * walkDist;
        const targetY = currentTile.current.y + dy * walkDist;

        // Slow leisurely pace: ~800ms per tile
        const duration = walkDist * 800;

        currentTile.current = { x: targetX, y: targetY };
        isMoving.value = true;

        // Set facing direction
        if (dy > 0) facing.value = 'south';
        else if (dy < 0) facing.value = 'north';
        else if (dx > 0) facing.value = 'east';
        else facing.value = 'west';

        tileX.value = withTiming(targetX, { duration, easing: Easing.linear });
        tileY.value = withTiming(targetY, { duration, easing: Easing.linear });

        // Use setTimeout to track completion — avoids worklet callback issues
        timeoutRef.current = setTimeout(() => {
          isMoving.value = false;
          scheduleNext();
        }, duration);
        return;
      }

      // All directions blocked — try again
      scheduleNext();
    }, idleMs);
  }, []);

  useEffect(() => {
    scheduleNext();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [scheduleNext]);

  return { tileX, tileY, isMoving, facing };
}
