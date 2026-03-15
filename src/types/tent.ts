/**
 * Tent Interior + Decoration System Types
 */

// Rotation uses directional names matching sprite file suffixes
export type Direction = 'down' | 'up' | 'left' | 'right';

export type TentSurfaceType = 'floor' | 'wall';

// Where an item can be placed
// 'tabletop' items stack on top of floor items that have provideSurface=true
export type PlacementSurface = 'floor' | 'wall' | 'rug' | 'tabletop';

// Shop categories for filtering
export type ItemCategory = 'furniture' | 'lighting' | 'plants' | 'rugs' | 'wall_art' | 'ambient' | 'music';

export interface CatalogItem {
  id: string;                           // 'cabinet_glass'
  name: string;                         // 'Glass Cabinet'
  category: ItemCategory;
  surface: PlacementSurface;
  price: number;                        // Light cost
  rotatable: boolean;                   // has directional sprites
  tier: number;                         // min room tier required (1 = base tent)
  provideSurface?: boolean;             // allows tabletop items to be stacked on this item
}

export interface TentSurfaceStyle {
  id: string;
  name: string;
  surfaceType: TentSurfaceType;
  price: number;
  tier: number;
  sheetAssetKey: string;
  previewAssetKey?: string;
  defaultOwned?: boolean;
}

export interface TentRoomStyleSelection {
  roomId: string;
  floorStyleId: string;
  wallStyleId: string;
}

export interface TentSurfacePreviewState {
  roomId: string | null;
  floorStyleId: string | null;
  wallStyleId: string | null;
}

export interface TentPlacement {
  id: string;
  itemId: string;
  roomId: string;                       // 'main' for tier 1 tent
  x: number;                            // pixel X in tilemap space
  y: number;                            // pixel Y in tilemap space
  direction: Direction;
  placedAt: number;
}

export interface TentRoom {
  id: string;                           // 'main', 'kitchen', 'study'
  name: string;
  mapKey: string;                       // tilemap JSON asset key
  width: number;                        // tiles
  height: number;                       // tiles
  unlockCost: number;                   // 0 for main room
}

// Tile classification for placement validation
// Derived from tilemap layers at runtime
export type TileType = 'void' | 'floor' | 'wall';

export interface TentMap {
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  tilesets: TentTileset[];
  layers: {
    floor: number[];
    walls: number[];
    ceiling: number[];
    foreground: number[];
  };
  // Derived: what type each tile is for placement validation
  tileTypes: TileType[];
}

export interface TentTileset {
  name: string;
  firstGid: number;
  columns: number;
  tileWidth: number;
  tileHeight: number;
  imageWidth: number;
  imageHeight: number;
  image: string;                        // filename
}
