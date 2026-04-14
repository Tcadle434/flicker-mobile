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

import { Alert } from 'react-native';
import { create } from 'zustand';
import type { Direction, TentSurfaceType } from '../types/tent';
import { validatePlacement } from '../services/tent/placementValidator';
import {
  DEFAULT_ITEM_SCALE,
  getAdjacentItemScale,
  getCatalogMap,
  getCatalogItem,
  getItemDirections,
  getScaledItemDimensions,
  normalizeItemScale,
} from '../services/tent/tentCatalog';
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
  ghostScale: number;
  ghostValid: boolean;
  isPersistingPlacement: boolean;
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
  decreaseGhostScale: () => void;
  increaseGhostScale: () => void;
  confirmPlacement: () => Promise<boolean>;
  cancelPlacement: () => void;
  /** Remove the currently-held ghost item from the room (returns to inventory) */
  removeGhostItem: () => Promise<boolean>;
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
  itemScale: number,
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
    itemScale,
    placements,
    getCatalogMap(),
    excludePlacementId,
  );
}

function anchorBottomCenter(
  itemId: string,
  currentDirection: Direction,
  nextDirection: Direction,
  currentScale: number,
  nextScale: number,
  x: number,
  y: number,
): { x: number; y: number } {
  const currentDims = getScaledItemDimensions(itemId, currentDirection, currentScale);
  const nextDims = getScaledItemDimensions(itemId, nextDirection, nextScale);

  if (!currentDims || !nextDims) {
    return { x, y };
  }

  return {
    x: x - Math.round((nextDims.w - currentDims.w) / 2),
    y: y - (nextDims.h - currentDims.h),
  };
}

export const useDecorateStore = create<DecorateState>((set, get) => ({
  isDecorating: false,
  subMode: 'place',

  ghostItemId: null,
  ghostPlacementId: null,
  ghostX: 0,
  ghostY: 0,
  ghostDirection: 'down',
  ghostScale: DEFAULT_ITEM_SCALE,
  ghostValid: false,
  isPersistingPlacement: false,
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
    ghostScale: DEFAULT_ITEM_SCALE,
    isPersistingPlacement: false,
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
    ghostScale: DEFAULT_ITEM_SCALE,
    isPersistingPlacement: false,
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
    ghostScale: DEFAULT_ITEM_SCALE,
    isPersistingPlacement: false,
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
    ghostScale: DEFAULT_ITEM_SCALE,
    isPersistingPlacement: false,
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
    const itemScale = DEFAULT_ITEM_SCALE;

    const valid = revalidateGhost(itemId, x, y, direction, itemScale);

    set({
      ghostItemId: itemId,
      ghostPlacementId: null,
      ghostX: x,
      ghostY: y,
      ghostDirection: direction,
      ghostScale: itemScale,
      ghostValid: valid,
      isPersistingPlacement: false,
      isPreview: false,
    });
  },

  startPreview: (itemId) => {
    // Like startPlacing but doesn't check ownership — item isn't owned yet
    const x = 5 * 16;
    const y = 7 * 16;
    const dirs = getItemDirections(itemId);
    const direction: Direction = dirs ? dirs[0] : 'down';
    const itemScale = DEFAULT_ITEM_SCALE;

    const valid = revalidateGhost(itemId, x, y, direction, itemScale);

    set({
      ghostItemId: itemId,
      ghostPlacementId: null,
      ghostX: x,
      ghostY: y,
      ghostDirection: direction,
      ghostScale: itemScale,
      ghostValid: valid,
      isPersistingPlacement: false,
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
      placement.scale,
      placementId,
    );

    set({
      ghostItemId: placement.itemId,
      ghostPlacementId: placementId,
      ghostX: placement.x,
      ghostY: placement.y,
      ghostDirection: placement.direction,
      ghostScale: normalizeItemScale(placement.scale),
      ghostValid: valid,
      isPersistingPlacement: false,
      isPreview: false,
    });
  },

  updateGhostPosition: (x, y) => {
    const { ghostItemId, ghostDirection, ghostPlacementId, ghostScale, isPersistingPlacement } = get();
    if (isPersistingPlacement) return;
    if (!ghostItemId) return;

    const valid = revalidateGhost(
      ghostItemId, x, y, ghostDirection, ghostScale, ghostPlacementId ?? undefined,
    );

    set({
      ghostX: x,
      ghostY: y,
      ghostValid: valid,
    });
  },

  rotateGhost: () => {
    const {
      ghostItemId,
      ghostX,
      ghostY,
      ghostDirection,
      ghostScale,
      ghostPlacementId,
      isPersistingPlacement,
    } = get();
    if (isPersistingPlacement) return;
    if (!ghostItemId) return;

    const item = getCatalogItem(ghostItemId);
    if (!item?.rotatable) return;

    const newDirection = nextDirection(ghostDirection, getItemDirections(ghostItemId));
    const nextPosition = anchorBottomCenter(
      ghostItemId,
      ghostDirection,
      newDirection,
      ghostScale,
      ghostScale,
      ghostX,
      ghostY,
    );
    const valid = revalidateGhost(
      ghostItemId,
      nextPosition.x,
      nextPosition.y,
      newDirection,
      ghostScale,
      ghostPlacementId ?? undefined,
    );

    set({
      ghostX: nextPosition.x,
      ghostY: nextPosition.y,
      ghostDirection: newDirection,
      ghostValid: valid,
    });
  },

  decreaseGhostScale: () => {
    const {
      ghostItemId,
      ghostX,
      ghostY,
      ghostDirection,
      ghostScale,
      ghostPlacementId,
      isPersistingPlacement,
    } = get();
    if (isPersistingPlacement) return;
    if (!ghostItemId) return;

    const nextScale = getAdjacentItemScale(ghostScale, -1);
    if (nextScale === ghostScale) return;

    const nextPosition = anchorBottomCenter(
      ghostItemId,
      ghostDirection,
      ghostDirection,
      ghostScale,
      nextScale,
      ghostX,
      ghostY,
    );
    const valid = revalidateGhost(
      ghostItemId,
      nextPosition.x,
      nextPosition.y,
      ghostDirection,
      nextScale,
      ghostPlacementId ?? undefined,
    );

    set({
      ghostX: nextPosition.x,
      ghostY: nextPosition.y,
      ghostScale: nextScale,
      ghostValid: valid,
    });
  },

  increaseGhostScale: () => {
    const {
      ghostItemId,
      ghostX,
      ghostY,
      ghostDirection,
      ghostScale,
      ghostPlacementId,
      isPersistingPlacement,
    } = get();
    if (isPersistingPlacement) return;
    if (!ghostItemId) return;

    const nextScale = getAdjacentItemScale(ghostScale, 1);
    if (nextScale === ghostScale) return;

    const nextPosition = anchorBottomCenter(
      ghostItemId,
      ghostDirection,
      ghostDirection,
      ghostScale,
      nextScale,
      ghostX,
      ghostY,
    );
    const valid = revalidateGhost(
      ghostItemId,
      nextPosition.x,
      nextPosition.y,
      ghostDirection,
      nextScale,
      ghostPlacementId ?? undefined,
    );

    set({
      ghostX: nextPosition.x,
      ghostY: nextPosition.y,
      ghostScale: nextScale,
      ghostValid: valid,
    });
  },

  confirmPlacement: async () => {
    const {
      ghostItemId,
      ghostPlacementId,
      ghostX,
      ghostY,
      ghostDirection,
      ghostScale,
      ghostValid,
      isPersistingPlacement,
      isPreview,
    } = get();
    if (!ghostItemId || !ghostValid || isPreview || isPersistingPlacement) return false;

    const tentStore = useTentStore.getState();
    set({ isPersistingPlacement: true });

    try {
      const didPersist = ghostPlacementId
        ? await tentStore.moveItem(ghostPlacementId, ghostX, ghostY, ghostDirection, ghostScale)
        : await tentStore.placeItem(
          ghostItemId,
          tentStore.currentRoomId,
          ghostX,
          ghostY,
          ghostDirection,
          ghostScale,
        );

      if (!didPersist) {
        Alert.alert('Could Not Save Item', 'Your room change was not saved. Please try again.');
        return false;
      }

      set({
        ghostItemId: null,
        ghostPlacementId: null,
        ghostScale: DEFAULT_ITEM_SCALE,
        ghostValid: false,
      });

      return true;
    } catch {
      Alert.alert('Could Not Save Item', 'Your room change was not saved. Please try again.');
      return false;
    } finally {
      set({ isPersistingPlacement: false });
    }
  },

  cancelPlacement: () => {
    set({
      ghostItemId: null,
      ghostPlacementId: null,
      ghostScale: DEFAULT_ITEM_SCALE,
      ghostValid: false,
      isPersistingPlacement: false,
      isPreview: false,
    });
  },

  removeGhostItem: async () => {
    const { ghostPlacementId, isPersistingPlacement } = get();
    if (!ghostPlacementId || isPersistingPlacement) return false;

    set({ isPersistingPlacement: true });

    try {
      const didPersist = await useTentStore.getState().removeItem(ghostPlacementId);
      if (!didPersist) {
        Alert.alert('Could Not Remove Item', 'Your room change was not saved. Please try again.');
        return false;
      }

      set({
        ghostItemId: null,
        ghostPlacementId: null,
        ghostScale: DEFAULT_ITEM_SCALE,
        ghostValid: false,
      });

      return true;
    } catch {
      Alert.alert('Could Not Remove Item', 'Your room change was not saved. Please try again.');
      return false;
    } finally {
      set({ isPersistingPlacement: false });
    }
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
