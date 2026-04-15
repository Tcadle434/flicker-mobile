/**
 * Tent Items Renderer
 *
 * Renders placed items plus the indoor Flicker actor for the main room.
 * Everything shares one render-order pipeline so Flicker can pass behind
 * floor furniture and in front of rugs without clipping through the scene.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, FilterMode, MipmapMode, useImage } from '@shopify/react-native-skia';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useTentStore } from '../../stores/tentStore';
import { useDecorateStore } from '../../stores/decorateStore';
import {
  getCatalogItem,
  getCatalogMap,
  getItemSprite,
  getScaledItemDimensions,
} from '../../services/tent/tentCatalog';
import {
  compareTentSceneRenderables,
  type TentSceneRenderable,
} from '../../services/tent/tentRenderOrder';
import { tentMap } from '../../services/world/tentMapLoader';
import {
  buildTentOccupancyGrid,
  findTentSpawnTile,
  isTentTileWalkable,
} from '../../services/world/tentWalkability';
import type { TentPlacement } from '../../types/tent';
import useGridWander from './useGridWander';
import TentFlickerRenderer from './TentFlickerRenderer';

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
  const isHydrating = useTentStore((s) => s.isHydrating);
  const ghostPlacementId = useDecorateStore((s) => s.ghostPlacementId);
  const isDecorating = useDecorateStore((s) => s.isDecorating);
  const previewRoomId = useDecorateStore((s) => s.previewRoomId);
  const previewFloorStyleId = useDecorateStore((s) => s.previewFloorStyleId);
  const previewWallStyleId = useDecorateStore((s) => s.previewWallStyleId);

  const roomPlacements = useMemo(() => (
    placements.filter((p) => p.roomId === currentRoomId && p.id !== ghostPlacementId)
  ), [placements, currentRoomId, ghostPlacementId]);

  const occupancyGrid = useMemo(() => (
    buildTentOccupancyGrid(currentRoomId, placements, getCatalogMap(), tentMap)
  ), [currentRoomId, placements]);

  const preferredSpawnCol = Math.floor(tentMap.width / 2);
  const preferredSpawnRow = Math.floor(tentMap.height / 2);
  const spawnTile = useMemo(() => (
    currentRoomId === 'main'
      ? findTentSpawnTile(occupancyGrid, preferredSpawnCol, preferredSpawnRow)
      : null
  ), [currentRoomId, occupancyGrid, preferredSpawnCol, preferredSpawnRow]);

  const surfacePreviewActive = !!previewRoomId && (!!previewFloorStyleId || !!previewWallStyleId);
  const flickerVisible = currentRoomId === 'main'
    && !isHydrating
    && !isDecorating
    && !surfacePreviewActive
    && !!spawnTile;

  const [actorTileRow, setActorTileRow] = useState<number | null>(spawnTile?.row ?? null);

  const isWalkableTile = useCallback((col: number, row: number) => (
    isTentTileWalkable(occupancyGrid, col, row)
  ), [occupancyGrid]);

  const {
    tileX: flickerTileX,
    tileY: flickerTileY,
    isMoving: flickerIsMoving,
    facing: flickerFacing,
  } = useGridWander(
    spawnTile?.col ?? preferredSpawnCol,
    spawnTile?.row ?? preferredSpawnRow,
    {
      enabled: flickerVisible,
      isWalkableTile,
      maxStepDistance: 2,
      idleRangeMs: [1500, 3500],
      msPerTile: 850,
      initialFacing: 'south',
    },
  );

  const syncActorTileRow = useCallback((nextRow: number) => {
    setActorTileRow((current) => (current === nextRow ? current : nextRow));
  }, []);

  useAnimatedReaction(
    () => Math.round(flickerTileY.value),
    (nextRow, previousRow) => {
      if (nextRow !== previousRow) {
        runOnJS(syncActorTileRow)(nextRow);
      }
    },
    [syncActorTileRow],
  );

  useEffect(() => {
    setActorTileRow(spawnTile?.row ?? null);
  }, [spawnTile]);

  const sortedRenderables = useMemo(() => {
    const renderables: TentSceneRenderable[] = roomPlacements.map((placement) => ({
      kind: 'placement',
      placement,
    }));

    if (flickerVisible && actorTileRow !== null) {
      renderables.push({
        kind: 'actor',
        id: 'tent-flicker',
        renderPlane: 40,
        renderLayer: 999,
        renderDepthY: (actorTileRow + 1) * tentMap.tileHeight,
      });
    }

    return renderables.sort(compareTentSceneRenderables);
  }, [actorTileRow, flickerVisible, roomPlacements]);

  return (
    <>
      {sortedRenderables.map((renderable) => (
        renderable.kind === 'placement' ? (
          <PlacedItem
            key={renderable.placement.id}
            placement={renderable.placement}
            scale={scale}
            offsetY={offsetY}
          />
        ) : (
          <TentFlickerRenderer
            key={renderable.id}
            tileX={flickerTileX}
            tileY={flickerTileY}
            isMoving={flickerIsMoving}
            facing={flickerFacing}
            scale={scale}
            offsetY={offsetY}
            tileWidth={tentMap.tileWidth}
            tileHeight={tentMap.tileHeight}
          />
        )
      ))}
    </>
  );
}
