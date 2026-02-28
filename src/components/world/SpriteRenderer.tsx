import React from 'react';
import {
  Image,
  FilterMode,
  MipmapMode,
} from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';

interface Props {
  image: SkImage;
  tileX: number;
  tileY: number;
  spriteWidth: number;
  spriteHeight: number;
  scale: number;
  offsetY: number;
}

export default function SpriteRenderer({
  image,
  tileX,
  tileY,
  spriteWidth,
  spriteHeight,
  scale,
  offsetY,
}: Props) {
  const tileSize = 16;
  const x = tileX * tileSize * scale;
  const y = offsetY + tileY * tileSize * scale;
  const w = spriteWidth * scale;
  const h = spriteHeight * scale;

  return (
    <Image
      image={image}
      x={x}
      y={y}
      width={w}
      height={h}
      fit="fill"
      sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
    />
  );
}
