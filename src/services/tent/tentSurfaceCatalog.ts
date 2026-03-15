import type { ImageSourcePropType } from 'react-native';
import surfaceStylesJson from '../../../assets/tent/surface-styles.json';
import { SURFACE_SHEET_ASSETS } from './generated/tentSurfaceAssetMap';
import type {
  TentRoomStyleSelection,
  TentSurfacePreviewState,
  TentSurfaceStyle,
  TentSurfaceType,
} from '../../types/tent';

interface RawSurfaceCatalog {
  styles: TentSurfaceStyle[];
}

const styles = (surfaceStylesJson as RawSurfaceCatalog).styles;
const styleMap = new Map<string, TentSurfaceStyle>(styles.map((style) => [style.id, style]));

const LEGACY_STYLE_ALIASES: Record<string, string> = {
  floor_default: 'floor_01',
  floor_sage: 'floor_02',
  floor_rosewood: 'floor_02',
  floor_twilight: 'floor_02',
  floor_honey: 'floor_02',
  wall_default: 'wall_01',
  wall_sage: 'wall_02',
  wall_blush: 'wall_02',
  wall_mist: 'wall_02',
  wall_midnight: 'wall_02',
};

const DEFAULT_STYLE_IDS: Record<TentSurfaceType, string> = {
  floor: styles.find((style) => style.surfaceType === 'floor' && style.defaultOwned)?.id ?? 'floor_01',
  wall: styles.find((style) => style.surfaceType === 'wall' && style.defaultOwned)?.id ?? 'wall_01',
};

export function normalizeSurfaceStyleId(id: string, surfaceType?: TentSurfaceType): string {
  const normalized = LEGACY_STYLE_ALIASES[id] ?? id;
  const style = styleMap.get(normalized);
  if (!style) {
    return surfaceType ? getDefaultSurfaceStyleId(surfaceType) : normalized;
  }
  if (surfaceType && style.surfaceType !== surfaceType) {
    return getDefaultSurfaceStyleId(surfaceType);
  }
  return normalized;
}

export function getAllSurfaceStyles(surfaceType?: TentSurfaceType): TentSurfaceStyle[] {
  if (!surfaceType) return styles;
  return styles.filter((style) => style.surfaceType === surfaceType);
}

export function getSurfaceStyle(id: string): TentSurfaceStyle | undefined {
  return styleMap.get(normalizeSurfaceStyleId(id));
}

export function getSurfaceSheet(styleId: string): ImageSourcePropType | null {
  const style = getSurfaceStyle(styleId);
  if (!style) return null;
  return SURFACE_SHEET_ASSETS[style.sheetAssetKey] ?? null;
}

export function getSurfacePreview(styleId: string): ImageSourcePropType | null {
  const style = getSurfaceStyle(styleId);
  if (!style) return null;
  const assetKey = style.previewAssetKey ?? style.sheetAssetKey;
  return SURFACE_SHEET_ASSETS[assetKey] ?? null;
}

export function getDefaultSurfaceStyleId(surfaceType: TentSurfaceType): string {
  return DEFAULT_STYLE_IDS[surfaceType];
}

export function getDefaultOwnedSurfaceStyleIds(): string[] {
  return styles
    .filter((style) => style.defaultOwned || style.price === 0)
    .map((style) => style.id);
}

export function isSurfaceStyleDefaultOwned(styleId: string): boolean {
  const style = getSurfaceStyle(styleId);
  return !!style && (style.defaultOwned || style.price === 0);
}

export function createDefaultRoomStyleSelection(roomId: string): TentRoomStyleSelection {
  return {
    roomId,
    floorStyleId: getDefaultSurfaceStyleId('floor'),
    wallStyleId: getDefaultSurfaceStyleId('wall'),
  };
}

export function resolveRoomStyleSelection(
  roomId: string,
  roomStyleSelections?: Record<string, TentRoomStyleSelection>,
  previewState?: TentSurfacePreviewState | null,
): TentRoomStyleSelection {
  const baseSelection = roomStyleSelections?.[roomId] ?? createDefaultRoomStyleSelection(roomId);
  const base: TentRoomStyleSelection = {
    roomId,
    floorStyleId: normalizeSurfaceStyleId(baseSelection.floorStyleId, 'floor'),
    wallStyleId: normalizeSurfaceStyleId(baseSelection.wallStyleId, 'wall'),
  };

  if (!previewState || previewState.roomId !== roomId) {
    return base;
  }

  return {
    roomId,
    floorStyleId: previewState.floorStyleId
      ? normalizeSurfaceStyleId(previewState.floorStyleId, 'floor')
      : base.floorStyleId,
    wallStyleId: previewState.wallStyleId
      ? normalizeSurfaceStyleId(previewState.wallStyleId, 'wall')
      : base.wallStyleId,
  };
}
