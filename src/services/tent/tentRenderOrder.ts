import type { CatalogItem, TentPlacement } from '../../types/tent';
import { getCatalogItem, getScaledItemDimensions } from './tentCatalog';

export interface TentActorRenderable {
  kind: 'actor';
  id: string;
  renderPlane?: number;
  renderLayer?: number;
  renderDepthY: number;
}

export interface TentPlacementRenderable {
  kind: 'placement';
  placement: TentPlacement;
}

export type TentSceneRenderable = TentActorRenderable | TentPlacementRenderable;

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

function getRenderablePlane(renderable: TentSceneRenderable): number {
  if (renderable.kind === 'actor') {
    return renderable.renderPlane ?? 20;
  }

  const item = getCatalogItem(renderable.placement.itemId);
  return item ? getTentRenderPlane(item) : 20;
}

function getRenderableLayer(renderable: TentSceneRenderable): number {
  if (renderable.kind === 'actor') {
    return renderable.renderLayer ?? 0;
  }

  const item = getCatalogItem(renderable.placement.itemId);
  return item?.renderLayer ?? 0;
}

function getRenderableDepthY(renderable: TentSceneRenderable): number {
  if (renderable.kind === 'actor') {
    return renderable.renderDepthY;
  }

  const item = getCatalogItem(renderable.placement.itemId);
  return item ? getTentDepthY(item, renderable.placement) : renderable.placement.y;
}

function getRenderableId(renderable: TentSceneRenderable): string {
  return renderable.kind === 'actor' ? renderable.id : renderable.placement.id;
}

export function compareTentSceneRenderables(
  a: TentSceneRenderable,
  b: TentSceneRenderable,
): number {
  const planeDiff = getRenderablePlane(a) - getRenderablePlane(b);
  if (planeDiff !== 0) return planeDiff;

  const renderLayerDiff = getRenderableLayer(a) - getRenderableLayer(b);
  if (renderLayerDiff !== 0) return renderLayerDiff;

  const depthDiff = getRenderableDepthY(a) - getRenderableDepthY(b);
  if (depthDiff !== 0) return depthDiff;

  if (a.kind === 'placement' && b.kind === 'placement') {
    const placedAtDiff = a.placement.placedAt - b.placement.placedAt;
    if (placedAtDiff !== 0) return placedAtDiff;
  }

  return getRenderableId(a).localeCompare(getRenderableId(b));
}

export function compareTentPlacementsForRender(a: TentPlacement, b: TentPlacement): number {
  return compareTentSceneRenderables(
    { kind: 'placement', placement: a },
    { kind: 'placement', placement: b },
  );
}
