/**
 * Tent Store
 *
 * Persistent state for tent placements, owned items, and room tier.
 * Supabase is source of truth — local state is a fast cache.
 * Follows same optimistic-update pattern as sanctuaryStore.
 */

import { create } from 'zustand';
import { supabase } from '../services/api/supabase';
import { useCurrencyStore } from './currencyStore';
import type { TentPlacement, Direction } from '../types/tent';

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
  fn: () => Promise<{ error: any }>,
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
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  purchaseItem: (itemId: string, price: number) => Promise<boolean>;
  placeItem: (itemId: string, roomId: string, x: number, y: number, direction: Direction) => void;
  moveItem: (placementId: string, x: number, y: number, direction: Direction) => void;
  removeItem: (placementId: string) => void;
  setCurrentRoom: (roomId: string) => void;
  /** Number of unplaced copies of an item the user owns */
  getAvailableCount: (itemId: string) => number;
}

export const useTentStore = create<TentState>((set, get) => ({
  currentRoomId: 'main',
  placements: [],
  ownedItemIds: [],
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return;

    const userId = await getUserId();
    if (!userId) {
      set({ isHydrated: true });
      return;
    }

    // Fetch placements
    try {
      const { data: placements } = await supabase
        .from('tent_placements')
        .select('id, item_id, room_id, tile_x, tile_y, direction, placed_at')
        .eq('user_id', userId);

      if (placements) {
        set({
          placements: placements.map((p) => ({
            id: p.id,
            itemId: p.item_id,
            roomId: p.room_id,
            x: p.tile_x,
            y: p.tile_y,
            direction: (p.direction as Direction) || 'down',
            placedAt: new Date(p.placed_at).getTime(),
          })),
        });
      }
    } catch {
      // offline — empty placements
    }

    // Fetch owned items from dedicated table
    try {
      const { data: owned } = await supabase
        .from('tent_owned_items')
        .select('item_id')
        .eq('user_id', userId);

      if (owned) {
        set({ ownedItemIds: owned.map((row) => row.item_id) });
      }
    } catch {
      // offline — empty owned items
    }

    set({ isHydrated: true });
  },

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

  placeItem: (itemId, roomId, x, y, direction) => {
    const id = generateId();
    const placement: TentPlacement = {
      id,
      itemId,
      roomId,
      x,
      y,
      direction,
      placedAt: Date.now(),
    };

    set((s) => ({ placements: [...s.placements, placement] }));

    // Persist to Supabase with retry
    getUserId().then((userId) => {
      if (!userId) return;
      persistWithRetry('placeItem', () =>
        supabase.from('tent_placements').insert({
          id,
          user_id: userId,
          item_id: itemId,
          room_id: roomId,
          tile_x: x,
          tile_y: y,
          direction,
        }),
      );
    });
  },

  moveItem: (placementId, x, y, direction) => {
    set((s) => ({
      placements: s.placements.map((p) =>
        p.id === placementId
          ? { ...p, x, y, direction }
          : p,
      ),
    }));

    // Persist to Supabase with retry
    getUserId().then((userId) => {
      if (!userId) return;
      persistWithRetry('moveItem', () =>
        supabase.from('tent_placements')
          .update({ tile_x: x, tile_y: y, direction })
          .eq('id', placementId)
          .eq('user_id', userId),
      );
    });
  },

  removeItem: (placementId) => {
    set((s) => ({
      placements: s.placements.filter((p) => p.id !== placementId),
    }));

    // Persist to Supabase with retry
    getUserId().then((userId) => {
      if (!userId) return;
      persistWithRetry('removeItem', () =>
        supabase.from('tent_placements')
          .delete()
          .eq('id', placementId)
          .eq('user_id', userId),
      );
    });
  },

  setCurrentRoom: (roomId) => set({ currentRoomId: roomId }),

  getAvailableCount: (itemId) => {
    const { ownedItemIds, placements } = get();
    const owned = ownedItemIds.filter((id) => id === itemId).length;
    const placed = placements.filter((p) => p.itemId === itemId).length;
    return Math.max(0, owned - placed);
  },
}));
