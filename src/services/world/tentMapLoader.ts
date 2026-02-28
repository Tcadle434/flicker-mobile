/**
 * Tent Interior Map Loader
 *
 * Parses the Tiled JSON for tent interior maps.
 * 4 layers: floor, walls, ceiling, foreground.
 * Derives tileTypes (void/floor/wall) for placement validation.
 */

import type { TentMap, TentTileset, TileType } from '../../types/tent';
import mapJson from '../../../assets/tiled/tent-interior-phase-1-tilemap.json';

interface RawTiledMap {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: { name: string; data: number[] }[];
  tilesets: {
    name: string;
    firstgid: number;
    columns: number;
    tilewidth: number;
    tileheight: number;
    imagewidth: number;
    imageheight: number;
    image: string;
  }[];
}

const raw = mapJson as RawTiledMap;

function getLayerData(name: string): number[] {
  const layer = raw.layers.find((l) => l.name === name);
  return layer?.data ?? new Array(raw.width * raw.height).fill(0);
}

function deriveTileTypes(
  floor: number[],
  walls: number[],
  ceiling: number[],
  foreground: number[],
  width: number,
  height: number,
): TileType[] {
  const types: TileType[] = new Array(width * height);
  for (let i = 0; i < types.length; i++) {
    const hasFloor = floor[i] !== 0;
    const hasWall = walls[i] !== 0;

    if (hasWall) {
      types[i] = 'wall';
    } else if (hasFloor) {
      types[i] = 'floor';
    } else {
      types[i] = 'void';
    }
  }
  return types;
}

const floorData = getLayerData('floor');
const wallsData = getLayerData('walls');
const ceilingData = getLayerData('ceiling');
const foregroundData = getLayerData('foreground');

const tilesets: TentTileset[] = raw.tilesets.map((ts) => ({
  name: ts.name,
  firstGid: ts.firstgid,
  columns: ts.columns,
  tileWidth: ts.tilewidth,
  tileHeight: ts.tileheight,
  imageWidth: ts.imagewidth,
  imageHeight: ts.imageheight,
  image: ts.image,
}));

export const tentMap: TentMap = {
  width: raw.width,
  height: raw.height,
  tileWidth: raw.tilewidth,
  tileHeight: raw.tileheight,
  tilesets,
  layers: {
    floor: floorData,
    walls: wallsData,
    ceiling: ceilingData,
    foreground: foregroundData,
  },
  tileTypes: deriveTileTypes(
    floorData, wallsData, ceilingData, foregroundData,
    raw.width, raw.height,
  ),
};

/**
 * Look up which tileset a GID belongs to and return the source rect.
 */
export function getTentTileSourceRect(
  gid: number,
): { tilesetIndex: number; x: number; y: number; w: number; h: number } | null {
  if (gid === 0) return null;

  // Find the tileset this GID belongs to (highest firstGid <= gid)
  let tilesetIdx = 0;
  for (let i = tilesets.length - 1; i >= 0; i--) {
    if (gid >= tilesets[i].firstGid) {
      tilesetIdx = i;
      break;
    }
  }

  const ts = tilesets[tilesetIdx];
  const localId = gid - ts.firstGid;
  const col = localId % ts.columns;
  const row = Math.floor(localId / ts.columns);

  return {
    tilesetIndex: tilesetIdx,
    x: col * ts.tileWidth,
    y: row * ts.tileHeight,
    w: ts.tileWidth,
    h: ts.tileHeight,
  };
}

/**
 * Get the tile type at a given position.
 */
export function getTileType(col: number, row: number): TileType {
  if (col < 0 || row < 0 || col >= tentMap.width || row >= tentMap.height) {
    return 'void';
  }
  return tentMap.tileTypes[row * tentMap.width + col];
}
