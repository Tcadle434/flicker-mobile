import React, { useMemo } from 'react';
import {
  Atlas,
  Skia,
  rect,
  FilterMode,
  MipmapMode,
} from '@shopify/react-native-skia';
import type { SkImage, SkRect, SkRSXform } from '@shopify/react-native-skia';

interface Props {
  tileset: SkImage;
  tilesetColumns: number;
  tileWidth: number;
  tileHeight: number;
  mapWidth: number;
  mapHeight: number;
  data: number[];
  scale: number;
  offsetY: number;
  screenHeight: number;
  /** For multi-tileset maps: only render GIDs in [firstGid, firstGid+tileCount) */
  firstGid?: number;
  tileCount?: number;
}

export default function TilemapRenderer({
  tileset,
  tilesetColumns,
  tileWidth,
  tileHeight,
  mapWidth,
  mapHeight,
  data,
  scale,
  offsetY,
  screenHeight,
  firstGid = 1,
  tileCount,
}: Props) {
  const scaledTileW = tileWidth * scale;
  const scaledTileH = tileHeight * scale;
  const maxGid = tileCount ? firstGid + tileCount : Infinity;

  const { sprites, transforms } = useMemo(() => {
    const startRow = Math.max(0, Math.floor(-offsetY / scaledTileH));
    const endRow = Math.min(mapHeight, Math.ceil((screenHeight - offsetY) / scaledTileH));

    const srcRects: SkRect[] = [];
    const xforms: SkRSXform[] = [];

    for (let row = startRow; row < endRow; row++) {
      for (let col = 0; col < mapWidth; col++) {
        const gid = data[row * mapWidth + col];
        if (gid === 0) continue;

        // Skip GIDs outside this tileset's range
        if (gid < firstGid || gid >= maxGid) continue;

        const localId = gid - firstGid;
        const srcCol = localId % tilesetColumns;
        const srcRow = Math.floor(localId / tilesetColumns);
        srcRects.push(rect(
          srcCol * tileWidth,
          srcRow * tileHeight,
          tileWidth,
          tileHeight,
        ));

        const destX = col * scaledTileW;
        const destY = offsetY + row * scaledTileH;
        xforms.push(Skia.RSXform(scale, 0, destX, destY));
      }
    }

    return { sprites: srcRects, transforms: xforms };
  }, [
    data, mapWidth, mapHeight, tilesetColumns,
    tileWidth, tileHeight, scale, scaledTileW, scaledTileH,
    offsetY, screenHeight, firstGid, maxGid,
  ]);

  if (sprites.length === 0) return null;

  return (
    <Atlas
      image={tileset}
      sprites={sprites}
      transforms={transforms}
      sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}
    />
  );
}
