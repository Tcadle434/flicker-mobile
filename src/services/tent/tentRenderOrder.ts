import type { CatalogItem, TentPlacement } from '../../types/tent';
import { getCatalogItem, getScaledItemDimensions } from './tentCatalog';

export function getTentRenderPlane(item: CatalogItem): number {
  switch (item.surface) {
    case 'rug':
      return 0;
    case 'wall':
      return 10;
    case 'floor':
      return 20;
    case 'tabletop':
      return 30;
    default:
      return 20;
  }
}

export function getTentDepthY(item: CatalogItem, placement: TentPlacement): number {
  const dims = getScaledItemDimensions(placement.itemId, placement.direction, placement.scale);
  return placement.y + (dims?.h ?? 0) + (item.renderDepthBias ?? 0);
}

export function compareTentPlacementsForRender(a: TentPlacement, b: TentPlacement): number {
  const aItem = getCatalogItem(a.itemId);
  const bItem = getCatalogItem(b.itemId);

  const planeDiff = (aItem ? getTentRenderPlane(aItem) : 20) - (bItem ? getTentRenderPlane(bItem) : 20);
  if (planeDiff !== 0) return planeDiff;

  const renderLayerDiff = (aItem?.renderLayer ?? 0) - (bItem?.renderLayer ?? 0);
  if (renderLayerDiff !== 0) return renderLayerDiff;

  const depthDiff = (aItem ? getTentDepthY(aItem, a) : a.y) - (bItem ? getTentDepthY(bItem, b) : b.y);
  if (depthDiff !== 0) return depthDiff;

  const placedAtDiff = a.placedAt - b.placedAt;
  if (placedAtDiff !== 0) return placedAtDiff;

  return a.id.localeCompare(b.id);
}
