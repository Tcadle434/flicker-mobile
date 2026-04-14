/**
 * Tent Store
 *
 * Persistent state for tent placements, owned items, and room tier.
 * Supabase is source of truth — local state mirrors confirmed backend writes.
 * Decoration ghost state still lives separately in decorateStore.
 */

import { create } from 'zustand';
import { supabase } from '../services/api/supabase';
import { commitTentSurfaceStyle } from '../services/api/tentSurfaceService';
import { useCurrencyStore } from './currencyStore';
import {
  createDefaultRoomStyleSelection,
  getDefaultOwnedSurfaceStyleIds,
  getDefaultSurfaceStyleId,
  getSurfaceStyle,
  isSurfaceStyleDefaultOwned,
  normalizeSurfaceStyleId,
} from '../services/tent/tentSurfaceCatalog';
import { DEFAULT_ITEM_SCALE, normalizeItemScale } from '../services/tent/tentCatalog';
import type {
  TentPlacement,
  Direction,
  TentRoomStyleSelection,
  TentSurfaceType,
} from '../types/tent';

// ── Helpers ────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const MAX_RETRIES = 2;
const RETRY_DELAY = 1500;

/** Run a Supabase write with retries. Logs on final failure. */
async function persistWithRetry(
  label: string,
  fn: () => PromiseLike<{ error: any }>,
): Promise<boolean> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { error } = await fn();
      if (!error) return true;
      console.warn(`[TentStore] ${label} attempt ${attempt + 1} failed:`, error.message);
    } catch (e) {
      console.warn(`[TentStore] ${label} attempt ${attempt + 1} threw:`, e);
    }
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
    }
  }
  console.error(`[TentStore] ${label} failed after ${MAX_RETRIES + 1} attempts`);
  return false;
}

// ── Store ──────────────────────────────────────────────────────────

interface TentState {
  currentRoomId: string;
  placements: TentPlacement[];
  ownedItemIds: string[];
  ownedSurfaceStyleIds: string[];
  roomStyleSelections: Record<string, TentRoomStyleSelection>;
  hydratedUserId: string | null;
  isHydrating: boolean;
  isSavingSurfaceStyle: boolean;

  hydrate: () => Promise<void>;
  resetForAuthChange: () => void;
  purchaseItem: (itemId: string, price: number) => Promise<boolean>;
  commitSurfaceStyleSelection: (
    roomId: string,
    surfaceType: TentSurfaceType,
    styleId: string,
  ) => Promise<{ ok: boolean; errorCode?: string }>;
  placeItem: (itemId: string, roomId: string, x: number, y: number, direction: Direction, scale?: number) => Promise<boolean>;
  moveItem: (placementId: string, x: number, y: number, direction: Direction, scale?: number) => Promise<boolean>;
  removeItem: (placementId: string) => Promise<boolean>;
  setCurrentRoom: (roomId: string) => void;
  /** Number of unplaced copies of an item the user owns */
  getAvailableCount: (itemId: string) => number;
  isSurfaceStyleOwned: (styleId: string) => boolean;
  getRoomStyleSelection: (roomId: string) => TentRoomStyleSelection;
}

function createDefaultRoomStyleSelections(): Record<string, TentRoomStyleSelection> {
  return {
    main: createDefaultRoomStyleSelection('main'),
  };
}

function createTentDefaults() {
  return {
    currentRoomId: 'main',
    placements: [],
    ownedItemIds: [],
    ownedSurfaceStyleIds: getDefaultOwnedSurfaceStyleIds(),
    roomStyleSelections: createDefaultRoomStyleSelections(),
    hydratedUserId: null,
    isHydrating: false,
    isSavingSurfaceStyle: false,
  };
}

function mergeOwnedSurfaceStyleIds(styleIds: string[]): string[] {
  return [...new Set([...getDefaultOwnedSurfaceStyleIds(), ...styleIds])];
}

function buildRoomStyleSelections(
  rows?: Array<{ room_id: string; floor_style_id: string | null; wall_style_id: string | null }>,
): Record<string, TentRoomStyleSelection> {
  const selections: Record<string, TentRoomStyleSelection> = {
    main: createDefaultRoomStyleSelection('main'),
  };

  for (const row of rows ?? []) {
    selections[row.room_id] = {
      roomId: row.room_id,
      floorStyleId: normalizeSurfaceStyleId(
        row.floor_style_id ?? getDefaultSurfaceStyleId('floor'),
        'floor',
      ),
      wallStyleId: normalizeSurfaceStyleId(
        row.wall_style_id ?? getDefaultSurfaceStyleId('wall'),
        'wall',
      ),
    };
  }

  return selections;
}

export const useTentStore = create<TentState>((set, get) => ({
  ...createTentDefaults(),

  hydrate: async () => {
    if (get().isHydrating) return;

    const userId = await getUserId();
    if (userId && get().hydratedUserId === userId) return;

    set({ isHydrating: true });

    try {
      if (!userId) {
        get().resetForAuthChange();
        return;
      }

      let didHydrate = false;
      let placements: TentPlacement[] = [];
      let ownedItemIds: string[] = [];
      let ownedSurfaceStyleIds = getDefaultOwnedSurfaceStyleIds();
      let roomStyleSelections = createDefaultRoomStyleSelections();

      try {
        const { data, error } = await supabase
          .from('tent_placements')
          .select('id, item_id, room_id, tile_x, tile_y, direction, scale, placed_at')
          .eq('user_id', userId);

        if (error) throw error;
        didHydrate = true;

        if (data) {
          placements = data.map((p) => ({
            id: p.id,
            itemId: p.item_id,
            roomId: p.room_id,
            x: p.tile_x,
            y: p.tile_y,
            direction: (p.direction as Direction) || 'down',
            scale: normalizeItemScale(p.scale),
            placedAt: new Date(p.placed_at).getTime(),
          }));
        }
      } catch {
        // offline — keep empty placements
      }

      try {
        const { data, error } = await supabase
          .from('tent_owned_items')
          .select('item_id')
          .eq('user_id', userId);

        if (error) throw error;
        didHydrate = true;

        if (data) {
          ownedItemIds = data.map((row) => row.item_id);
        }
      } catch {
        // offline — keep empty owned items
      }

      try {
        const { data, error } = await supabase
          .from('tent_owned_surface_styles')
          .select('style_id')
          .eq('user_id', userId);

        if (error) throw error;
        didHydrate = true;

        if (data) {
          ownedSurfaceStyleIds = mergeOwnedSurfaceStyleIds(
            data.map((row) => normalizeSurfaceStyleId(row.style_id)),
          );
        }
      } catch {
        // offline — keep default owned styles
      }

      try {
        const { data, error } = await supabase
          .from('tent_room_styles')
          .select('room_id, floor_style_id, wall_style_id')
          .eq('user_id', userId);

        if (error) throw error;
        didHydrate = true;

        if (data) {
          roomStyleSelections = buildRoomStyleSelections(data);
        }
      } catch {
        // offline — keep default room styles
      }

      set((state) => ({
        placements,
        ownedItemIds,
        ownedSurfaceStyleIds,
        roomStyleSelections,
        hydratedUserId: didHydrate ? userId : null,
        currentRoomId: roomStyleSelections[state.currentRoomId] ? state.currentRoomId : 'main',
      }));
    } finally {
      set({ isHydrating: false });
    }
  },

  resetForAuthChange: () => set({
    ...createTentDefaults(),
  }),

  purchaseItem: async (itemId, price) => {
    const spent = await useCurrencyStore.getState().spend(price, itemId, 'tent_purchase');
    if (!spent) return false;

    const ownedId = generateId();
    set((s) => ({ ownedItemIds: [...s.ownedItemIds, itemId] }));

    // Persist ownership to dedicated table with retry
    getUserId().then((userId) => {
      if (!userId) return;
      persistWithRetry('purchaseItem', () =>
        supabase.from('tent_owned_items').insert({
          id: ownedId,
          user_id: userId,
          item_id: itemId,
        }),
      );
    });

    return true;
  },

  commitSurfaceStyleSelection: async (roomId, surfaceType, styleId) => {
    const style = getSurfaceStyle(styleId);
    if (!style || style.surfaceType !== surfaceType) {
      return { ok: false, errorCode: 'invalid_surface_type' };
    }

    const normalizedStyleId = normalizeSurfaceStyleId(styleId, surfaceType);
    const currentSelection = get().getRoomStyleSelection(roomId);
    const isAlreadyEquipped = surfaceType === 'floor'
      ? currentSelection.floorStyleId === normalizedStyleId
      : currentSelection.wallStyleId === normalizedStyleId;

    if (isAlreadyEquipped && get().isSurfaceStyleOwned(normalizedStyleId)) {
      return { ok: true };
    }

    set({ isSavingSurfaceStyle: true });

    try {
      const result = await commitTentSurfaceStyle({
        roomId,
        surfaceType,
        styleId: normalizedStyleId,
        price: style.price,
      });

      if (!result.ok) {
        return { ok: false, errorCode: result.errorCode };
      }

      const nextSelection: TentRoomStyleSelection = {
        roomId,
        floorStyleId: normalizeSurfaceStyleId(
          result.floorStyleId ?? currentSelection.floorStyleId,
          'floor',
        ),
        wallStyleId: normalizeSurfaceStyleId(
          result.wallStyleId ?? currentSelection.wallStyleId,
          'wall',
        ),
      };

      set((state) => ({
        ownedSurfaceStyleIds: mergeOwnedSurfaceStyleIds([
          ...state.ownedSurfaceStyleIds,
          normalizedStyleId,
        ]),
        roomStyleSelections: {
          ...state.roomStyleSelections,
          [roomId]: nextSelection,
        },
      }));

      if (typeof result.lightBalance === 'number') {
        useCurrencyStore.setState({ balance: result.lightBalance });
      }

      return { ok: true };
    } finally {
      set({ isSavingSurfaceStyle: false });
    }
  },

  placeItem: async (itemId, roomId, x, y, direction, scale = DEFAULT_ITEM_SCALE) => {
    const userId = await getUserId();
    if (!userId) return false;

    const id = generateId();
    const normalizedScale = normalizeItemScale(scale);
    const placement: TentPlacement = {
      id,
      itemId,
      roomId,
      x,
      y,
      direction,
      scale: normalizedScale,
      placedAt: Date.now(),
    };

    const didPersist = await persistWithRetry('placeItem', () =>
      supabase.from('tent_placements').insert({
        id,
        user_id: userId,
        item_id: itemId,
        room_id: roomId,
        tile_x: x,
        tile_y: y,
        direction,
        scale: normalizedScale,
      }),
    );

    if (!didPersist) return false;

    set((s) => ({ placements: [...s.placements, placement] }));
    return true;
  },

  moveItem: async (placementId, x, y, direction, scale) => {
    const userId = await getUserId();
    if (!userId) return false;

    const existingPlacement = get().placements.find((placement) => placement.id === placementId);
    if (!existingPlacement) return false;

    const normalizedScale = normalizeItemScale(scale ?? existingPlacement.scale);
    const didPersist = await persistWithRetry('moveItem', () =>
      supabase.from('tent_placements')
        .update({
          tile_x: x,
          tile_y: y,
          direction,
          scale: normalizedScale,
        })
        .eq('id', placementId)
        .eq('user_id', userId),
    );

    if (!didPersist) return false;

    set((s) => ({
      placements: s.placements.map((p) =>
        p.id === placementId
          ? {
              ...p,
              x,
              y,
              direction,
              scale: normalizedScale,
            }
          : p,
      ),
    }));
    return true;
  },

  removeItem: async (placementId) => {
    const userId = await getUserId();
    if (!userId) return false;

    const existingPlacement = get().placements.find((placement) => placement.id === placementId);
    if (!existingPlacement) return false;

    const didPersist = await persistWithRetry('removeItem', () =>
      supabase.from('tent_placements')
        .delete()
        .eq('id', placementId)
        .eq('user_id', userId),
    );

    if (!didPersist) return false;

    set((s) => ({
      placements: s.placements.filter((p) => p.id !== placementId),
    }));
    return true;
  },

  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),

  getAvailableCount: (itemId) => {
    const { ownedItemIds, placements } = get();
    const owned = ownedItemIds.filter((id) => id === itemId).length;
    const placed = placements.filter((p) => p.itemId === itemId).length;
    return Math.max(0, owned - placed);
  },

  isSurfaceStyleOwned: (styleId) => {
    const normalized = normalizeSurfaceStyleId(styleId);
    if (isSurfaceStyleDefaultOwned(normalized)) return true;
    return get().ownedSurfaceStyleIds.includes(normalized);
  },

  getRoomStyleSelection: (roomId) => {
    const selection = get().roomStyleSelections[roomId] ?? createDefaultRoomStyleSelection(roomId);
    return {
      roomId,
      floorStyleId: normalizeSurfaceStyleId(selection.floorStyleId, 'floor'),
      wallStyleId: normalizeSurfaceStyleId(selection.wallStyleId, 'wall'),
    };
  },
}));
