/**
 * Decorate Store
 *
 * UI-only Zustand store for decoration mode state machine.
 * No persistence — resets when the user leaves decorate mode.
 *
 * Two sub-modes:
 * - 'place': Show owned items tray
 * - 'edit': Show room finish panel
 */

import { create } from 'zustand';
import type { Direction, TentSurfaceType } from '../types/tent';
import { validatePlacement } from '../services/tent/placementValidator';
import { getCatalogMap, getCatalogItem, getItemDirections } from '../services/tent/tentCatalog';
import { useTentStore } from './tentStore';

interface DecorateState {
  // Mode state
  isDecorating: boolean;
  subMode: 'place' | 'edit';

  // Ghost item state (active during placement or move)
  ghostItemId: string | null;
  ghostPlacementId: string | null; // non-null when moving an existing item
  ghostX: number;
  ghostY: number;
  ghostDirection: Direction;
  ghostValid: boolean;
  isPreview: boolean; // true = ghost is preview-only, not confirmable
  previewRoomId: string | null;
  previewFloorStyleId: string | null;
  previewWallStyleId: string | null;

  // Actions
  enterDecorate: () => void;
  exitDecorate: () => void;
  switchToPlaceMode: () => void;
  switchToEditMode: () => void;

  // Placement flow
  startPlacing: (itemId: string) => void;
  startPreview: (itemId: string) => void;
  startMoving: (placementId: string) => void;
  updateGhostPosition: (x: number, y: number) => void;
  rotateGhost: () => void;
  confirmPlacement: () => void;
  cancelPlacement: () => void;
  /** Remove the currently-held ghost item from the room (returns to inventory) */
  removeGhostItem: () => void;
  previewSurfaceStyle: (roomId: string, surfaceType: TentSurfaceType, styleId: string) => void;
  clearSurfacePreview: (surfaceType?: TentSurfaceType) => void;
}

const DEFAULT_DIRECTION_ORDER: Direction[] = ['down', 'right', 'up', 'left'];

function nextDirection(current: Direction, available?: Direction[] | null): Direction {
  const order = available && available.length > 0 ? available : DEFAULT_DIRECTION_ORDER;
  const idx = order.indexOf(current);
  if (idx === -1) return order[0];
  return order[(idx + 1) % order.length];
}

function revalidateGhost(
  itemId: string,
  x: number,
  y: number,
  direction: Direction,
  excludePlacementId?: string,
): boolean {
  const item = getCatalogItem(itemId);
  if (!item) return false;

  const placements = useTentStore.getState().placements;
  return validatePlacement(
    item,
    x,
    y,
    direction,
    placements,
    getCatalogMap(),
    excludePlacementId,
  );
}

export const useDecorateStore = create<DecorateState>((set, get) => ({
  isDecorating: false,
  subMode: 'place',

  ghostItemId: null,
  ghostPlacementId: null,
  ghostX: 0,
  ghostY: 0,
  ghostDirection: 'down',
  ghostValid: false,
  isPreview: false,
  previewRoomId: null,
  previewFloorStyleId: null,
  previewWallStyleId: null,

  enterDecorate: () => set({
    isDecorating: true,
    subMode: 'place',
    ghostItemId: null,
    ghostPlacementId: null,
    ghostValid: false,
    isPreview: false,
    previewRoomId: null,
    previewFloorStyleId: null,
    previewWallStyleId: null,
  }),

  exitDecorate: () => set({
    isDecorating: false,
    subMode: 'place',
    ghostItemId: null,
    ghostPlacementId: null,
    ghostValid: false,
    isPreview: false,
    previewRoomId: null,
    previewFloorStyleId: null,
    previewWallStyleId: null,
  }),

  switchToPlaceMode: () => set({
    subMode: 'place',
    ghostItemId: null,
    ghostPlacementId: null,
    ghostValid: false,
    isPreview: false,
    previewRoomId: null,
    previewFloorStyleId: null,
    previewWallStyleId: null,
  }),

  switchToEditMode: () => set({
    subMode: 'edit',
    ghostItemId: null,
    ghostPlacementId: null,
    ghostValid: false,
    isPreview: false,
    previewRoomId: null,
    previewFloorStyleId: null,
    previewWallStyleId: null,
  }),

  startPlacing: (itemId) => {
    const available = useTentStore.getState().getAvailableCount(itemId);
    if (available <= 0) return;

    // Default to center-ish of the map (pixel coords)
    const x = 5 * 16;
    const y = 7 * 16;
    const dirs = getItemDirections(itemId);
    const direction: Direction = dirs ? dirs[0] : 'down';

    const valid = revalidateGhost(itemId, x, y, direction);

    set({
      ghostItemId: itemId,
      ghostPlacementId: null,
      ghostX: x,
      ghostY: y,
      ghostDirection: direction,
      ghostValid: valid,
      isPreview: false,
    });
  },

  startPreview: (itemId) => {
    // Like startPlacing but doesn't check ownership — item isn't owned yet
    const x = 5 * 16;
    const y = 7 * 16;
    const dirs = getItemDirections(itemId);
    const direction: Direction = dirs ? dirs[0] : 'down';

    const valid = revalidateGhost(itemId, x, y, direction);

    set({
      ghostItemId: itemId,
      ghostPlacementId: null,
      ghostX: x,
      ghostY: y,
      ghostDirection: direction,
      ghostValid: valid,
      isPreview: true,
    });
  },

  startMoving: (placementId) => {
    const placement = useTentStore.getState().placements.find((p) => p.id === placementId);
    if (!placement) return;

    const valid = revalidateGhost(
      placement.itemId,
      placement.x,
      placement.y,
      placement.direction,
      placementId,
    );

    set({
      ghostItemId: placement.itemId,
      ghostPlacementId: placementId,
      ghostX: placement.x,
      ghostY: placement.y,
      ghostDirection: placement.direction,
      ghostValid: valid,
      isPreview: false,
    });
  },

  updateGhostPosition: (x, y) => {
    const { ghostItemId, ghostDirection, ghostPlacementId } = get();
    if (!ghostItemId) return;

    const valid = revalidateGhost(
      ghostItemId, x, y, ghostDirection, ghostPlacementId ?? undefined,
    );

    set({
      ghostX: x,
      ghostY: y,
      ghostValid: valid,
    });
  },

  rotateGhost: () => {
    const { ghostItemId, ghostX, ghostY, ghostDirection, ghostPlacementId } = get();
    if (!ghostItemId) return;

    const item = getCatalogItem(ghostItemId);
    if (!item?.rotatable) return;

    const newDirection = nextDirection(ghostDirection, getItemDirections(ghostItemId));
    const valid = revalidateGhost(
      ghostItemId, ghostX, ghostY, newDirection, ghostPlacementId ?? undefined,
    );

    set({
      ghostDirection: newDirection,
      ghostValid: valid,
    });
  },

  confirmPlacement: () => {
    const { ghostItemId, ghostPlacementId, ghostX, ghostY, ghostDirection, ghostValid, isPreview } = get();
    if (!ghostItemId || !ghostValid || isPreview) return;

    const tentStore = useTentStore.getState();

    if (ghostPlacementId) {
      tentStore.moveItem(ghostPlacementId, ghostX, ghostY, ghostDirection);
    } else {
      tentStore.placeItem(ghostItemId, tentStore.currentRoomId, ghostX, ghostY, ghostDirection);
    }

    set({
      ghostItemId: null,
      ghostPlacementId: null,
      ghostValid: false,
    });
  },

  cancelPlacement: () => {
    set({
      ghostItemId: null,
      ghostPlacementId: null,
      ghostValid: false,
      isPreview: false,
    });
  },

  removeGhostItem: () => {
    const { ghostPlacementId } = get();
    if (!ghostPlacementId) return;

    useTentStore.getState().removeItem(ghostPlacementId);

    set({
      ghostItemId: null,
      ghostPlacementId: null,
      ghostValid: false,
    });
  },

  previewSurfaceStyle: (roomId, surfaceType, styleId) => set((state) => {
    const sameRoomPreview = state.previewRoomId === roomId;
    return {
      previewRoomId: roomId,
      previewFloorStyleId: surfaceType === 'floor'
        ? styleId
        : (sameRoomPreview ? state.previewFloorStyleId : null),
      previewWallStyleId: surfaceType === 'wall'
        ? styleId
        : (sameRoomPreview ? state.previewWallStyleId : null),
    };
  }),

  clearSurfacePreview: (surfaceType) => set((state) => {
    if (!surfaceType) {
      return {
        previewRoomId: null,
        previewFloorStyleId: null,
        previewWallStyleId: null,
      };
    }

    const nextFloorStyleId = surfaceType === 'floor' ? null : state.previewFloorStyleId;
    const nextWallStyleId = surfaceType === 'wall' ? null : state.previewWallStyleId;
    const hasAnyPreview = !!nextFloorStyleId || !!nextWallStyleId;

    return {
      previewRoomId: hasAnyPreview ? state.previewRoomId : null,
      previewFloorStyleId: nextFloorStyleId,
      previewWallStyleId: nextWallStyleId,
    };
  }),
}));
