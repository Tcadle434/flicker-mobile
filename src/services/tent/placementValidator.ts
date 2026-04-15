/**
 * Placement Validator
 *
 * Validates whether an item can be placed at a given pixel position
 * using AABB (bounding box) collision detection.
 *
 * Stacking: items with surface='tabletop' can be placed on top of
 * floor items that have provideSurface=true.
 */

import type { TentPlacement, CatalogItem, Direction } from '../../types/tent';
import { tentMap, getTileType } from '../world/tentMapLoader';
import { DEFAULT_ITEM_SCALE, getScaledItemDimensions } from './tentCatalog';

interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function getPlacementAABB(p: TentPlacement): AABB | null {
  const dims = getScaledItemDimensions(p.itemId, p.direction, p.scale);
  if (!dims) return null;
  return { x: p.x, y: p.y, w: dims.w, h: dims.h };
}

const TILE_SIZE = 16;
const BASE_H = 8; // tile validation base height — bottom portion of sprite
const MIN_FOOTPRINT_H = 8;
const MAX_FOOTPRINT_H = 16;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getFloorCollisionMode(item: CatalogItem): 'solid' | 'overlay' {
  return item.floorCollisionMode ?? 'solid';
}

function getCollisionFootprintHeight(item: CatalogItem, spriteHeight: number): number {
  return item.collisionFootprintHeight
    ?? clamp(Math.round(spriteHeight * 0.35), MIN_FOOTPRINT_H, MAX_FOOTPRINT_H);
}

export function getGroundedFloorCollisionFootprint(
  item: CatalogItem,
  x: number,
  y: number,
  w: number,
  h: number,
): AABB {
  const footprintHeight = getCollisionFootprintHeight(item, h);
  return {
    x,
    y: y + h - footprintHeight,
    w,
    h: footprintHeight,
  };
}

/**
 * Validate whether an item can be placed at pixel position (x, y).
 *
 * Rules:
 * - Item must be within room bounds
 * - Bottom portion of floor/rug items must be over floor tiles
 * - Upper portion can be over floor or wall tiles (e.g. bookshelf against wall)
 * - Solid floor furniture can't overlap other solid floor furniture
 * - Overlay floor decor can overlap floor furniture visually
 * - Rugs can go under floor items but not overlap other rugs
 * - Wall items must be over wall tiles and can't overlap other wall items
 * - Tabletop items must overlap a provideSurface floor item, can't overlap other tabletop items
 */
export function validatePlacement(
  item: CatalogItem,
  x: number,
  y: number,
  direction: Direction,
  itemScale: number = DEFAULT_ITEM_SCALE,
  existingPlacements: TentPlacement[],
  catalog: Map<string, CatalogItem>,
  excludePlacementId?: string,
): boolean {
  const dims = getScaledItemDimensions(item.id, direction, itemScale);
  if (!dims) return false;

  const itemBox: AABB = { x, y, w: dims.w, h: dims.h };

  // Room pixel bounds
  const roomW = tentMap.width * TILE_SIZE;
  const roomH = tentMap.height * TILE_SIZE;
  if (x < 0 || y < 0 || x + dims.w > roomW || y + dims.h > roomH) return false;

  // ── Tile type checks ────────────────────────────────────────────
  // Find all tiles the item overlaps
  const tileX0 = Math.floor(x / TILE_SIZE);
  const tileY0 = Math.floor(y / TILE_SIZE);
  const tileX1 = Math.floor((x + dims.w - 1) / TILE_SIZE);
  const tileY1 = Math.floor((y + dims.h - 1) / TILE_SIZE);

  // The "base" of a floor item is its bottom TILE_SIZE pixels.
  // All tiles overlapped by the base must be floor.
  // Upper tiles (above the base) can be floor or wall (e.g. bookshelf against wall).
  const baseTopPx = y + dims.h - BASE_H;
  const baseTileY0 = Math.max(tileY0, Math.floor(Math.max(0, baseTopPx) / TILE_SIZE));

  for (let ty = tileY0; ty <= tileY1; ty++) {
    for (let tx = tileX0; tx <= tileX1; tx++) {
      const tileType = getTileType(tx, ty);

      if (item.surface === 'wall') {
        if (tileType !== 'wall') return false;
      } else if (item.surface === 'floor' || item.surface === 'rug') {
        if (ty >= baseTileY0) {
          // Base region: must be floor
          if (tileType !== 'floor') return false;
        } else {
          // Above base: floor or wall OK, void is not
          if (tileType === 'void') return false;
        }
      } else if (item.surface === 'tabletop') {
        if (tileType === 'void') return false;
      }
    }
  }

  // ── AABB collision checks ───────────────────────────────────────
  let overlapsSurfaceProvider = false;

  for (const p of existingPlacements) {
    if (p.id === excludePlacementId) continue;

    const placedItem = catalog.get(p.itemId);
    if (!placedItem) continue;

    const placedBox = getPlacementAABB(p);
    if (!placedBox) continue;

    // Floor-vs-floor: overlay decor may visually overlap solid furniture.
    // Solid furniture still blocks other solid furniture via grounded footprints.
    if (item.surface === 'floor' && placedItem.surface === 'floor') {
      const itemMode = getFloorCollisionMode(item);
      const placedMode = getFloorCollisionMode(placedItem);

      if (itemMode === 'solid' && placedMode === 'solid') {
        const itemFootprint = getGroundedFloorCollisionFootprint(item, x, y, dims.w, dims.h);
        const placedFootprint = getGroundedFloorCollisionFootprint(
          placedItem,
          placedBox.x,
          placedBox.y,
          placedBox.w,
          placedBox.h,
        );
        if (aabbOverlap(itemFootprint, placedFootprint)) return false;
      }
      continue;
    }

    if (!aabbOverlap(itemBox, placedBox)) continue;

    // Items overlap — check surface rules
    if (item.surface === 'tabletop') {
      if (placedItem.surface === 'tabletop') return false; // can't stack tabletop on tabletop
      if (placedItem.surface === 'floor' && placedItem.provideSurface) {
        overlapsSurfaceProvider = true;
      }
    } else if (item.surface === 'floor') {
      // Floor items can overlap rugs (rug goes underneath) but not wall items
      if (placedItem.surface === 'wall') return false;
    } else if (item.surface === 'rug') {
      if (placedItem.surface === 'rug') return false;
    } else if (item.surface === 'wall') {
      if (placedItem.surface === 'wall') return false;
    }
  }

  // Tabletop items must overlap at least one surface provider
  if (item.surface === 'tabletop' && !overlapsSurfaceProvider) return false;

  return true;
}
