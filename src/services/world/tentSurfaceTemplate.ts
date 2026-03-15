import type { TentSurfaceType } from '../../types/tent';
import { tentMap } from './tentMapLoader';

const FLOOR_TEMPLATE_GIDS: Record<number, number> = {
  19123: 1, // top_left
  19124: 2, // top_edge
  19125: 3, // top_right
  19199: 4, // left_edge
  19200: 5, // fill
};

const WALL_TEMPLATE_GIDS: Record<number, number> = {
  19990: 1, // top_row
  19994: 2, // mid_row
  20066: 3, // bottom_row
};

function buildTemplate(layer: number[], gidMap: Record<number, number>): number[] {
  return layer.map((gid) => gidMap[gid] ?? 0);
}

export const TENT_SURFACE_TILE_SIZE = 16;

export const TENT_SURFACE_TILE_COLUMNS: Record<TentSurfaceType, number> = {
  floor: 3,
  wall: 1,
};

export const TENT_SURFACE_TILE_COUNTS: Record<TentSurfaceType, number> = {
  floor: 5,
  wall: 3,
};

const floorLayer = buildTemplate(tentMap.layers.floor, FLOOR_TEMPLATE_GIDS);
const wallLayer = buildTemplate(tentMap.layers.walls, WALL_TEMPLATE_GIDS);

export function getTentSurfaceLayer(surfaceType: TentSurfaceType): number[] {
  return surfaceType === 'floor' ? floorLayer : wallLayer;
}
