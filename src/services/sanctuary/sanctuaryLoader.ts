/**
 * Sanctuary Loader (stub)
 *
 * Old sanctuary zone/catalog assets have been removed as part of the pixel art
 * rebrand. This file is kept as a stub so existing boot-sequence calls in
 * _layout.tsx don't crash. Will be replaced when the new sanctuary is built.
 */

import { useSanctuaryStore, type Zone, type ShopItem } from '../../stores/sanctuaryStore';

export function loadSanctuaryData(): void {
  // No-op — old zone/catalog data removed
}

export function getZonesOrdered(): Zone[] {
  return [];
}

export function getCatalogForZone(_zoneId: string, _category?: string): ShopItem[] {
  return [];
}

export function getZoneCategories(_zoneId: string): string[] {
  return [];
}
