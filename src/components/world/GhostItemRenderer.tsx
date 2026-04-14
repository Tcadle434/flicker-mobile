/**
 * Ghost Item Renderer
 *
 * Renders the item currently being placed or moved.
 * Semi-transparent with green tint when valid, red tint when invalid.
 * Offset slightly upward to create a "hovering" effect.
 */

import React from 'react';
import { Group, Image, FilterMode, MipmapMode, ColorMatrix } from '@shopify/react-native-skia';
import { useImage } from '@shopify/react-native-skia';
import { useDecorateStore } from '../../stores/decorateStore';
import { getCatalogItem, getItemSprite, getScaledItemDimensions } from '../../services/tent/tentCatalog';

interface Props {
  scale: number;
  offsetY: number;
}

export default function GhostItemRenderer({ scale, offsetY }: Props) {
  const ghostItemId = useDecorateStore((s) => s.ghostItemId);
  const ghostX = useDecorateStore((s) => s.ghostX);
  const ghostY = useDecorateStore((s) => s.ghostY);
  const ghostDirection = useDecorateStore((s) => s.ghostDirection);
  const ghostScale = useDecorateStore((s) => s.ghostScale);
  const ghostValid = useDecorateStore((s) => s.ghostValid);

  const item = ghostItemId ? getCatalogItem(ghostItemId) : null;
  const sprite = ghostItemId ? getItemSprite(ghostItemId, ghostDirection) : null;
  const skiaImage = useImage(sprite as any);
  const dims = ghostItemId ? getScaledItemDimensions(ghostItemId, ghostDirection, ghostScale) : null;

  if (!ghostItemId || !item || !skiaImage || !dims) return null;

  const x = ghostX * scale;
  const y = offsetY + ghostY * scale;
  const w = dims.w * scale;
  const h = dims.h * scale;

  return (
    <Group opacity={0.7}>
      <Image
        image={skiaImage}
        x={x}
        y={y}
        width={w}
        height={h}
        fit="fill"
        sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
      >
        {!ghostValid && (
          <ColorMatrix
            matrix={[
              1, 0, 0, 0, 0.3,
              0, 0.3, 0, 0, 0,
              0, 0, 0.3, 0, 0,
              0, 0, 0, 1, 0,
            ]}
          />
        )}
      </Image>
    </Group>
  );
}
