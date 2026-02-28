/**
 * Sanctuary Store
 *
 * Manages zone unlocks, owned items, and placed decorations.
 * Supabase is the source of truth — local state is a fast cache.
 */

import { create } from 'zustand';
import { supabase } from '../services/api/supabase';
import { useCurrencyStore } from './currencyStore';

// ────────────────────────────── Types ──────────────────────────────

export interface ZoneAnchor {
  id: string;
  x: number;      // normalized 0..1
  y: number;      // normalized 0..1
  z: number;      // render order
  categories: string[];
}

export interface Zone {
  id: string;
  name: string;
  background: string; // asset key
  anchors: ZoneAnchor[];
  unlockRequirement: { type: 'light_total'; value: number };
}

export interface ShopItem {
  id: string;
  zoneId: string;
  category: string;
  image: string;   // asset key
  name: string;
  price: number;
}

export interface Placement {
  id: string;
  zoneId: string;
  anchorId: string;
  itemId: string;
  placedAt: number;
}

// ────────────────────────────── Store ──────────────────────────────

interface SanctuaryState {
  // Data
  zones: Zone[];
  catalog: ShopItem[];
  ownedItemIds: string[];
  placements: Placement[];
  unlockedZoneIds: string[];
  activeZoneId: string;

  // Actions
  loadZones: (zones: Zone[]) => void;
  loadCatalog: (items: ShopItem[]) => void;
  unlockZone: (zoneId: string) => void;
  setActiveZone: (zoneId: string) => void;
  purchaseItem: (itemId: string) => Promise<boolean>;
  placeItem: (zoneId: string, anchorId: string, itemId: string) => void;
  removeItem: (placementId: string) => void;
  hydrate: () => Promise<void>;
}

async function getUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export const useSanctuaryStore = create<SanctuaryState>((set, get) => ({
  zones: [],
  catalog: [],
  ownedItemIds: [],
  placements: [],
  unlockedZoneIds: ['hearth'], // hearth is always unlocked
  activeZoneId: 'hearth',

  loadZones: (zones) => set({ zones }),

  loadCatalog: (items) => set({ catalog: items }),

  unlockZone: (zoneId) => {
    const { unlockedZoneIds } = get();
    if (unlockedZoneIds.includes(zoneId)) return;
    set({ unlockedZoneIds: [...unlockedZoneIds, zoneId] });

    // Sync to Supabase
    getUserId().then((userId) => {
      if (!userId) return;
      supabase.from('sanctuary_unlocks').insert({
        user_id: userId,
        zone_id: zoneId,
      }).then(() => undefined);
    });
  },

  setActiveZone: (zoneId) => set({ activeZoneId: zoneId }),

  purchaseItem: async (itemId) => {
    const { ownedItemIds, catalog } = get();
    if (ownedItemIds.includes(itemId)) return false;

    const item = catalog.find((i) => i.id === itemId);
    if (!item) return false;

    const spent = await useCurrencyStore.getState().spend(item.price, itemId);
    if (!spent) return false;

    set({ ownedItemIds: [...ownedItemIds, itemId] });
    // ownedItemIds is derived from currency_transactions (spend source=sanctuary_purchase)
    // so Supabase already knows via the transaction
    return true;
  },

  placeItem: (zoneId, anchorId, itemId) => {
    const { placements } = get();
    const filtered = placements.filter(
      (p) => !(p.zoneId === zoneId && p.anchorId === anchorId),
    );
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const placement: Placement = {
      id,
      zoneId,
      anchorId,
      itemId,
      placedAt: Date.now(),
    };
    set({ placements: [...filtered, placement] });

    // Sync to Supabase: delete old placement at this anchor, insert new
    getUserId().then((userId) => {
      if (!userId) return;

      // Remove existing placement at this anchor
      supabase.from('sanctuary_placements')
        .delete()
        .eq('user_id', userId)
        .eq('zone_id', zoneId)
        .eq('anchor_id', anchorId)
        .then(() => {
          // Insert new placement
          supabase.from('sanctuary_placements').insert({
            id,
            user_id: userId,
            zone_id: zoneId,
            anchor_id: anchorId,
            item_id: itemId,
          }).then(() => undefined);
        });
    });
  },

  removeItem: (placementId) => {
    set((s) => ({
      placements: s.placements.filter((p) => p.id !== placementId),
    }));

    // Sync to Supabase
    getUserId().then((userId) => {
      if (!userId) return;
      supabase.from('sanctuary_placements')
        .delete()
        .eq('id', placementId)
        .eq('user_id', userId)
        .then(() => undefined);
    });
  },

  hydrate: async () => {
    const userId = await getUserId();
    if (!userId) return;

    // Fetch unlocked zones
    try {
      const { data: unlocks } = await supabase
        .from('sanctuary_unlocks')
        .select('zone_id')
        .eq('user_id', userId);

      if (unlocks) {
        const zoneIds = unlocks.map((u) => u.zone_id);
        // Always include hearth
        if (!zoneIds.includes('hearth')) zoneIds.unshift('hearth');
        set({ unlockedZoneIds: zoneIds });
      }
    } catch {
      // offline fallback — hearth only
    }

    // Fetch placements
    try {
      const { data: placements } = await supabase
        .from('sanctuary_placements')
        .select('id, zone_id, anchor_id, item_id, placed_at')
        .eq('user_id', userId);

      if (placements) {
        set({
          placements: placements.map((p) => ({
            id: p.id,
            zoneId: p.zone_id,
            anchorId: p.anchor_id,
            itemId: p.item_id,
            placedAt: new Date(p.placed_at).getTime(),
          })),
        });
      }
    } catch {
      // offline — empty placements
    }

    // Derive owned items from currency_transactions (sanctuary_purchase spends)
    try {
      const { data: txns } = await supabase
        .from('currency_transactions')
        .select('source, id')
        .eq('user_id', userId)
        .eq('source', 'sanctuary_purchase');

      if (txns) {
        // Extract item IDs from transaction IDs: tx_spend_{itemId}_{timestamp}
        const ownedIds = txns
          .map((tx) => {
            const match = tx.id.match(/^tx_spend_(.+)_\d+$/);
            return match ? match[1] : null;
          })
          .filter(Boolean) as string[];
        set({ ownedItemIds: ownedIds });
      }
    } catch {
      // offline — empty owned items
    }
  },
}));
