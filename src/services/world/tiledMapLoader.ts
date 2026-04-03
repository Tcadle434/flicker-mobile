import mapJson from '../../../assets/tiled/flicker-forest-tilemap.json';

export interface TiledMap {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  tilesetColumns: number;
  data: number[];
  walkableData: number[];
}

export interface SourceRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const map = mapJson as {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: { name: string; data: number[] }[];
  tilesets: { columns: number }[];
};

const visualLayer = map.layers.find((l) => l.name !== 'walkable') ?? map.layers[0];
const walkableLayer = map.layers.find((l) => l.name === 'walkable');

export const forestMap: TiledMap = {
  width: map.width,
  height: map.height,
  tileWidth: map.tilewidth,
  tileHeight: map.tileheight,
  tilesetColumns: map.tilesets[0].columns,
  data: visualLayer.data,
  walkableData: walkableLayer?.data ?? [],
};

// Tent footprint in tile coordinates (top-left anchor)
const TENT_TILE_X = 18;
const TENT_TILE_Y = 37;
const TENT_TILE_W = 13; // 208px / 16px per tile
const TENT_TILE_H = 11; // 176px / 16px per tile

/**
 * Check if a tile coordinate is walkable.
 * Checks the Tiled walkable layer AND blocks the tent footprint.
 */
export function isWalkable(col: number, row: number): boolean {
  const { width, height, walkableData } = forestMap;

  // Out of bounds
  if (col < 0 || row < 0 || col >= width || row >= height) return false;

  // Tent footprint — always blocked
  if (
    col >= TENT_TILE_X &&
    col < TENT_TILE_X + TENT_TILE_W &&
    row >= TENT_TILE_Y &&
    row < TENT_TILE_Y + TENT_TILE_H
  ) {
    return false;
  }

  // Walkable layer: any non-zero GID = walkable
  return walkableData[row * width + col] !== 0;
}

export function getTileSourceRect(
  gid: number,
  tilesetColumns: number,
  tileWidth: number,
  tileHeight: number,
): SourceRect {
  const id = gid - 1;
  const col = id % tilesetColumns;
  const row = Math.floor(id / tilesetColumns);
  return {
    x: col * tileWidth,
    y: row * tileHeight,
    w: tileWidth,
    h: tileHeight,
  };
}
