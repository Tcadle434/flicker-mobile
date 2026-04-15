import type { CatalogItem, TentMap, TentPlacement } from '../../types/tent';
import { getScaledItemDimensions } from '../tent/tentCatalog';

export interface TentOccupancyGrid {
  roomId: string;
  width: number;
  height: number;
  blocked: boolean[];
}

function tileIndex(width: number, col: number, row: number): number {
  return row * width + col;
}

function isTileBlockedByStaticRoom(map: TentMap, col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= map.width || row >= map.height) {
    return true;
  }

  return map.tileTypes[tileIndex(map.width, col, row)] !== 'floor';
}

function markFootprintBlocked(
  grid: TentOccupancyGrid,
  map: TentMap,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const colStart = Math.max(0, Math.floor(x / map.tileWidth));
  const rowStart = Math.max(0, Math.floor(y / map.tileHeight));
  const colEnd = Math.min(grid.width - 1, Math.floor((x + w - 1) / map.tileWidth));
  const rowEnd = Math.min(grid.height - 1, Math.floor((y + h - 1) / map.tileHeight));

  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      grid.blocked[tileIndex(grid.width, col, row)] = true;
    }
  }
}

function shouldBlockWalking(item: CatalogItem): boolean {
  return item.surface === 'floor';
}

export function buildTentOccupancyGrid(
  roomId: string,
  placements: TentPlacement[],
  catalog: Map<string, CatalogItem>,
  map: TentMap,
): TentOccupancyGrid {
  const grid: TentOccupancyGrid = {
    roomId,
    width: map.width,
    height: map.height,
    blocked: new Array(map.width * map.height).fill(false),
  };

  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      if (isTileBlockedByStaticRoom(map, col, row)) {
        grid.blocked[tileIndex(map.width, col, row)] = true;
      }
    }
  }

  for (const placement of placements) {
    if (placement.roomId !== roomId) continue;

    const item = catalog.get(placement.itemId);
    if (!item || !shouldBlockWalking(item)) continue;

    const dims = getScaledItemDimensions(
      placement.itemId,
      placement.direction,
      placement.scale,
    );
    if (!dims) continue;

    markFootprintBlocked(grid, map, placement.x, placement.y, dims.w, dims.h);
  }

  return grid;
}

export function isTentTileWalkable(
  grid: TentOccupancyGrid,
  col: number,
  row: number,
): boolean {
  if (col < 0 || row < 0 || col >= grid.width || row >= grid.height) {
    return false;
  }

  return !grid.blocked[tileIndex(grid.width, col, row)];
}

export function findTentSpawnTile(
  grid: TentOccupancyGrid,
  preferredCol: number,
  preferredRow: number,
): { col: number; row: number } | null {
  const clampedCol = Math.max(0, Math.min(grid.width - 1, preferredCol));
  const clampedRow = Math.max(0, Math.min(grid.height - 1, preferredRow));

  if (isTentTileWalkable(grid, clampedCol, clampedRow)) {
    return { col: clampedCol, row: clampedRow };
  }

  const maxRadius = Math.max(grid.width, grid.height);

  for (let radius = 1; radius <= maxRadius; radius++) {
    for (let row = clampedRow - radius; row <= clampedRow + radius; row++) {
      for (let col = clampedCol - radius; col <= clampedCol + radius; col++) {
        const isEdge =
          row === clampedRow - radius ||
          row === clampedRow + radius ||
          col === clampedCol - radius ||
          col === clampedCol + radius;

        if (!isEdge) continue;
        if (!isTentTileWalkable(grid, col, row)) continue;

        return {
          col: Math.max(0, Math.min(grid.width - 1, col)),
          row: Math.max(0, Math.min(grid.height - 1, row)),
        };
      }
    }
  }

  return null;
}
