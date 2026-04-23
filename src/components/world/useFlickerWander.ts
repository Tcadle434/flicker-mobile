import { useCallback } from 'react';
import { isWalkable } from '../../services/world/tiledMapLoader';
import useGridWander, { type Direction, type GridWanderResult } from './useGridWander';

export type { Direction } from './useGridWander';

export default function useFlickerWander(
  startTileX: number,
  startTileY: number,
  enabled: boolean = true,
): GridWanderResult {
  const isWalkableTile = useCallback((col: number, row: number) => isWalkable(col, row), []);

  return useGridWander(startTileX, startTileY, {
    enabled,
    isWalkableTile,
    maxStepDistance: 5,
    idleRangeMs: [1000, 3000],
    msPerTile: 800,
    initialFacing: 'south',
  });
}
