/**
 * Tent Item Catalog
 *
 * Loads the static catalog JSON and provides lookup helpers.
 * Maps sprite keys to require() calls for RN image loading.
 */

import type { CatalogItem, ItemCategory, Direction } from '../../types/tent';
import catalogJson from '../../../assets/tent/catalog.json';
import { Image as RNImage } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

// ── Static catalog data ────────────────────────────────────────────

const items = catalogJson.items as CatalogItem[];
const catalogMap = new Map<string, CatalogItem>(items.map((i) => [i.id, i]));

// ── Sprite asset map ───────────────────────────────────────────────
// Non-rotatable items: single sprite
// Rotatable items: one sprite per direction

const SPRITE_MAP: Record<string, ImageSourcePropType> = {
  // Furniture — beds
  bed_large_01: require('../../../assets/sprites/interior-decorations/bed_large_01.png'),
  bed_large_02: require('../../../assets/sprites/interior-decorations/bed_large_02.png'),
  bed_large_03: require('../../../assets/sprites/interior-decorations/bed_large_03.png'),
  bed_large_04: require('../../../assets/sprites/interior-decorations/bed_large_04.png'),
  bed_large_05: require('../../../assets/sprites/interior-decorations/bed_large_05.png'),
  bed_small_01: require('../../../assets/sprites/interior-decorations/bed_small_01.png'),
  bed_small_02: require('../../../assets/sprites/interior-decorations/bed_small_02.png'),
  bed_small_03: require('../../../assets/sprites/interior-decorations/bed_small_03.png'),
  bed_small_04: require('../../../assets/sprites/interior-decorations/bed_small_04.png'),

  // Furniture — tables & desks
  bedside_table_01: require('../../../assets/sprites/interior-decorations/bedside_table_01.png'),
  bedside_table_02: require('../../../assets/sprites/interior-decorations/bedside_table_02.png'),
  bedside_table_03: require('../../../assets/sprites/interior-decorations/bedside_table_03.png'),
  coffee_table_books: require('../../../assets/sprites/interior-decorations/coffee_table_books.png'),
  coffee_table_no_books: require('../../../assets/sprites/interior-decorations/coffee_table_no_books.png'),
  desk_01: require('../../../assets/sprites/interior-decorations/desk_01.png'),
  glass_table_01: require('../../../assets/sprites/interior-decorations/glass_table_01.png'),
  glass_table_02: require('../../../assets/sprites/interior-decorations/glass_table_02.png'),
  glass_table_03: require('../../../assets/sprites/interior-decorations/glass_table_03.png'),
  kitchen_counter_01: require('../../../assets/sprites/interior-decorations/kitchen_counter_01.png'),

  // Furniture — storage & bookshelves
  bookshelf_01: require('../../../assets/sprites/interior-decorations/bookshelf_01.png'),
  bookshelf_02: require('../../../assets/sprites/interior-decorations/bookshelf_02.png'),
  bookshelf_03: require('../../../assets/sprites/interior-decorations/bookshelf_03.png'),
  bookshelf_04: require('../../../assets/sprites/interior-decorations/bookshelf_04.png'),
  bookshelf_05: require('../../../assets/sprites/interior-decorations/bookshelf_05.png'),
  bookshelf_06: require('../../../assets/sprites/interior-decorations/bookshelf_06.png'),
  cabinet_glass: require('../../../assets/sprites/interior-decorations/cabinet_glass.png'),
  cabinet_no_glass: require('../../../assets/sprites/interior-decorations/cabinet_no_glass.png'),

  // Furniture — appliances & bathroom
  fireplace_lit_01: require('../../../assets/sprites/interior-decorations/fireplace_lit_01.png'),
  fireplace_unlit_01: require('../../../assets/sprites/interior-decorations/fireplace_unlit_01.png'),
  refrigerator_01: require('../../../assets/sprites/interior-decorations/refrigerator_01.png'),
  refrigerator_02: require('../../../assets/sprites/interior-decorations/refrigerator_02.png'),
  refrigerator_03: require('../../../assets/sprites/interior-decorations/refrigerator_03.png'),
  shower_bath_01: require('../../../assets/sprites/interior-decorations/shower_bath_01.png'),
  sink_01: require('../../../assets/sprites/interior-decorations/sink_01.png'),
  toilet_01: require('../../../assets/sprites/interior-decorations/toilet_01.png'),
  toilet_02: require('../../../assets/sprites/interior-decorations/toilet_02.png'),

  // Lighting
  candle_01: require('../../../assets/sprites/interior-decorations/candle_01.png'),
  candles_02: require('../../../assets/sprites/interior-decorations/candles_02.png'),
  floor_lamp_01: require('../../../assets/sprites/interior-decorations/floor_lamp_01.png'),
  floor_lamp_02: require('../../../assets/sprites/interior-decorations/floor_lamp_02.png'),
  table_lamp_01: require('../../../assets/sprites/interior-decorations/table_lamp_01.png'),
  table_lamp_02: require('../../../assets/sprites/interior-decorations/table_lamp_02.png'),
  table_lamp_03: require('../../../assets/sprites/interior-decorations/table_lamp_03.png'),
  table_lamp_04: require('../../../assets/sprites/interior-decorations/table_lamp_04.png'),
  table_lamp_05: require('../../../assets/sprites/interior-decorations/table_lamp_05.png'),
  table_lamp_06: require('../../../assets/sprites/interior-decorations/table_lamp_06.png'),

  // Plants
  cactus_01: require('../../../assets/sprites/interior-decorations/cactus_01.png'),
  cactus_02: require('../../../assets/sprites/interior-decorations/cactus_02.png'),
  cactus_03: require('../../../assets/sprites/interior-decorations/cactus_03.png'),
  christmas_tree_01: require('../../../assets/sprites/interior-decorations/christmas_tree_01.png'),
  christmas_tree_02: require('../../../assets/sprites/interior-decorations/christmas_tree_02.png'),
  christmas_tree_03: require('../../../assets/sprites/interior-decorations/christmas_tree_03.png'),
  flowers_01: require('../../../assets/sprites/interior-decorations/flowers_01.png'),
  flowers_02: require('../../../assets/sprites/interior-decorations/flowers_02.png'),
  flowers_03: require('../../../assets/sprites/interior-decorations/flowers_03.png'),
  flowers_04: require('../../../assets/sprites/interior-decorations/flowers_04.png'),
  flowers_05: require('../../../assets/sprites/interior-decorations/flowers_05.png'),
  flowers_06: require('../../../assets/sprites/interior-decorations/flowers_06.png'),
  flowers_07: require('../../../assets/sprites/interior-decorations/flowers_07.png'),
  plant_large_01: require('../../../assets/sprites/interior-decorations/plant_large_01.png'),
  plant_tall_01: require('../../../assets/sprites/interior-decorations/plant_tall_01.png'),
  plant_tall_02: require('../../../assets/sprites/interior-decorations/plant_tall_02.png'),
  potted_plant_01: require('../../../assets/sprites/interior-decorations/potted_plant_01.png'),
  potted_plant_02: require('../../../assets/sprites/interior-decorations/potted_plant_02.png'),
  potted_plant_03: require('../../../assets/sprites/interior-decorations/potted_plant_03.png'),
  potted_sapling_01: require('../../../assets/sprites/interior-decorations/potted_sapling_01.png'),

  // Rugs
  rug_01: require('../../../assets/sprites/interior-decorations/rug_01.png'),
  rug_02: require('../../../assets/sprites/interior-decorations/rug_02.png'),
  rug_03: require('../../../assets/sprites/interior-decorations/rug_03.png'),
  rug_04: require('../../../assets/sprites/interior-decorations/rug_04.png'),

  // Wall art
  mounted_tv: require('../../../assets/sprites/interior-decorations/mounted_tv.png'),
  painting_01: require('../../../assets/sprites/interior-decorations/painting_01.png'),
  painting_02: require('../../../assets/sprites/interior-decorations/painting_02.png'),
  painting_03: require('../../../assets/sprites/interior-decorations/painting_03.png'),
  window_01: require('../../../assets/sprites/interior-decorations/window_01.png'),
  window_02: require('../../../assets/sprites/interior-decorations/window_02.png'),
  window_03: require('../../../assets/sprites/interior-decorations/window_03.png'),

  // Ambient — tabletop
  blender_01: require('../../../assets/sprites/interior-decorations/blender_01.png'),
  bottles_01: require('../../../assets/sprites/interior-decorations/bottles_01.png'),
  bottles_02: require('../../../assets/sprites/interior-decorations/bottles_02.png'),
  carrots_01: require('../../../assets/sprites/interior-decorations/carrots_01.png'),
  coffee_maker_01: require('../../../assets/sprites/interior-decorations/coffee_maker_01.png'),
  coffee_maker_02: require('../../../assets/sprites/interior-decorations/coffee_maker_02.png'),
  computer_01: require('../../../assets/sprites/interior-decorations/computer_01.png'),
  computer_02: require('../../../assets/sprites/interior-decorations/computer_02.png'),
  cutting_board_01: require('../../../assets/sprites/interior-decorations/cutting_board_01.png'),
  fruit_basket_01: require('../../../assets/sprites/interior-decorations/fruit_basket_01.png'),
  fruit_basket_02: require('../../../assets/sprites/interior-decorations/fruit_basket_02.png'),
  globe_01: require('../../../assets/sprites/interior-decorations/globe_01.png'),
  globe_02: require('../../../assets/sprites/interior-decorations/globe_02.png'),
  kitchen_knife_01: require('../../../assets/sprites/interior-decorations/kitchen_knife_01.png'),
  loose_books_1: require('../../../assets/sprites/interior-decorations/loose_books_1.png'),
  loose_books_02: require('../../../assets/sprites/interior-decorations/loose_books_02.png'),
  microwave_01: require('../../../assets/sprites/interior-decorations/microwave_01.png'),
  plates_drying_rack: require('../../../assets/sprites/interior-decorations/plates_drying_rack.png'),
  potion_01: require('../../../assets/sprites/interior-decorations/potion_01.png'),
  potion_02: require('../../../assets/sprites/interior-decorations/potion_02.png'),
  tomatoes_01: require('../../../assets/sprites/interior-decorations/tomatoes_01.png'),

  // Ambient — floor
  plushy_01: require('../../../assets/sprites/interior-decorations/plushy_01.png'),
  plushy_02: require('../../../assets/sprites/interior-decorations/plushy_02.png'),
  plushy_03: require('../../../assets/sprites/interior-decorations/plushy_03.png'),
  tv_ground_1: require('../../../assets/sprites/interior-decorations/tv_ground_1.png'),
  wood_pile_01: require('../../../assets/sprites/interior-decorations/wood_pile_01.png'),

  // Music
  guitar_01: require('../../../assets/sprites/interior-decorations/guitar_01.png'),
  guitar_02: require('../../../assets/sprites/interior-decorations/guitar_02.png'),
  guitar_03: require('../../../assets/sprites/interior-decorations/guitar_03.png'),
};

// Only include directions that have real unique sprite assets.
// The rotation system cycles through these — no made-up directions.
const ROTATABLE_SPRITE_MAP: Record<string, Partial<Record<Direction, ImageSourcePropType>>> = {
  chair_01: {
    down: require('../../../assets/sprites/interior-decorations/chair_01/chair_01_down.png'),
    up: require('../../../assets/sprites/interior-decorations/chair_01/chair_01_up.png'),
    left: require('../../../assets/sprites/interior-decorations/chair_01/chair_01_left.png'),
    right: require('../../../assets/sprites/interior-decorations/chair_01/chair_01_right.png'),
  },
  corner_desk: {
    left: require('../../../assets/sprites/interior-decorations/corner_desk/corner_desk_left.png'),
    right: require('../../../assets/sprites/interior-decorations/corner_desk/corner_desk_right.png'),
  },
  grand_bed_01: {
    down: require('../../../assets/sprites/interior-decorations/grand_bed/grand_bed_01_south.png'),
    up: require('../../../assets/sprites/interior-decorations/grand_bed/grand_bed_01_north.png'),
  },
};

// ── Public API ─────────────────────────────────────────────────────

export function getCatalogItem(id: string): CatalogItem | undefined {
  return catalogMap.get(id);
}

export function getAllItems(): CatalogItem[] {
  return items;
}

export function getItemsByCategory(category: ItemCategory): CatalogItem[] {
  return items.filter((i) => i.category === category);
}

export function getItemsByTier(tier: number): CatalogItem[] {
  return items.filter((i) => i.tier <= tier);
}

export function getCatalogMap(): Map<string, CatalogItem> {
  return catalogMap;
}

/**
 * Get the available directions for a rotatable item.
 * Returns null for non-rotatable items.
 */
export function getItemDirections(itemId: string): Direction[] | null {
  const rotatable = ROTATABLE_SPRITE_MAP[itemId];
  if (!rotatable) return null;
  return Object.keys(rotatable) as Direction[];
}

/**
 * Get the sprite source for an item, accounting for direction on rotatable items.
 */
export function getItemSprite(itemId: string, direction: Direction = 'down'): ImageSourcePropType | null {
  // Check rotatable first
  const rotatable = ROTATABLE_SPRITE_MAP[itemId];
  if (rotatable) {
    // Use requested direction, or fall back to first available
    const dirs = Object.keys(rotatable) as Direction[];
    return rotatable[direction] ?? rotatable[dirs[0]] ?? null;
  }

  return SPRITE_MAP[itemId] ?? null;
}

/**
 * Get the thumbnail sprite (always the 'down' direction).
 */
export function getItemThumbnail(itemId: string): ImageSourcePropType | null {
  return getItemSprite(itemId, 'down');
}

// ── Auto-derived dimensions ─────────────────────────────────────────
// Sprite pixel dimensions are resolved from the RN asset source at module load.
// Tile footprint is computed as ceil(px / TILE_SIZE).

const TILE_SIZE = 16;
const dimensionCache = new Map<string, { w: number; h: number }>();

/**
 * Get the pixel dimensions of an item's sprite for a given direction.
 * Uses Image.resolveAssetSource() for synchronous lookup of static assets.
 */
export function getItemDimensions(
  itemId: string,
  direction: Direction = 'down',
): { w: number; h: number } | null {
  const key = `${itemId}_${direction}`;
  const cached = dimensionCache.get(key);
  if (cached) return cached;

  const sprite = getItemSprite(itemId, direction);
  if (!sprite) return null;

  const asset = RNImage.resolveAssetSource(sprite as any);
  if (!asset || !asset.width || !asset.height) return null;

  const dims = { w: asset.width, h: asset.height };
  dimensionCache.set(key, dims);
  return dims;
}

/**
 * Get the tile footprint for an item at a given direction.
 * Auto-derived from sprite pixel dimensions: ceil(px / 16).
 */
export function getItemFootprint(
  itemId: string,
  direction: Direction = 'down',
): { w: number; h: number } {
  const dims = getItemDimensions(itemId, direction);
  if (!dims) return { w: 1, h: 1 }; // fallback
  return {
    w: Math.ceil(dims.w / TILE_SIZE),
    h: Math.ceil(dims.h / TILE_SIZE),
  };
}
