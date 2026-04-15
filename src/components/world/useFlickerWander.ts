import { isWalkable } from '../../services/world/tiledMapLoader';
import useGridWander, { type Direction, type GridWanderResult } from './useGridWander';

export type { Direction } from './useGridWander';

export default function useFlickerWander(
  startTileX: number,
  startTileY: number,
): GridWanderResult {
  return useGridWander(startTileX, startTileY, {
    isWalkableTile: (col, row) => isWalkable(col, row),
    maxStepDistance: 5,
    idleRangeMs: [1000, 3000],
    msPerTile: 800,
    initialFacing: 'south',
  });
}
