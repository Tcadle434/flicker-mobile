/**
 * Tent Items Renderer
 *
 * Renders all placed items in the current room.
 * Items are sorted by render plane, configured layer, and sprite foot depth.
 * Uses Skia Image with RN asset sources loaded via useImage.
 */

import React, { useMemo } from 'react';
import { Image, FilterMode, MipmapMode } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';
import { useImage } from '@shopify/react-native-skia';
import { useTentStore } from '../../stores/tentStore';
import { useDecorateStore } from '../../stores/decorateStore';
import { getCatalogItem, getItemSprite, getScaledItemDimensions } from '../../services/tent/tentCatalog';
import { compareTentPlacementsForRender } from '../../services/tent/tentRenderOrder';
import type { TentPlacement } from '../../types/tent';

interface Props {
  scale: number;
  offsetY: number;
}

/**
 * Individual placed item component.
 * Each item loads its own Skia image from the RN asset source.
 */
function PlacedItem({
  placement,
  scale,
  offsetY,
}: {
  placement: TentPlacement;
  scale: number;
  offsetY: number;
}) {
  const item = getCatalogItem(placement.itemId);
  const sprite = getItemSprite(placement.itemId, placement.direction);

  // Resolve the RN asset to a Skia image
  const skiaImage = useImage(sprite as any);

  const dims = getScaledItemDimensions(placement.itemId, placement.direction, placement.scale);

  if (!item || !skiaImage || !dims) return null;

  const x = placement.x * scale;
  const y = offsetY + placement.y * scale;
  const w = dims.w * scale;
  const h = dims.h * scale;

  return (
    <Image
      image={skiaImage}
      x={x}
      y={y}
      width={w}
      height={h}
      fit="fill"
      sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
    />
  );
}

export default function TentItemsRenderer({ scale, offsetY }: Props) {
  const placements = useTentStore((s) => s.placements);
  const currentRoomId = useTentStore((s) => s.currentRoomId);
  const ghostPlacementId = useDecorateStore((s) => s.ghostPlacementId);

  // Filter to current room, exclude item being moved.
  // Sort by render plane, catalog-controlled layer, then sprite foot depth.
  const sortedPlacements = useMemo(() => {
    return placements
      .filter((p) => p.roomId === currentRoomId && p.id !== ghostPlacementId)
      .sort(compareTentPlacementsForRender);
  }, [placements, currentRoomId, ghostPlacementId]);

  return (
    <>
      {sortedPlacements.map((p) => (
        <PlacedItem key={p.id} placement={p} scale={scale} offsetY={offsetY} />
      ))}
    </>
  );
}
