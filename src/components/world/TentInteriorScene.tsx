/**
 * Tent Interior Scene
 *
 * Main Skia Canvas rendering the tent interior.
 * Renders 4 tilemap layers (floor, walls, ceiling, foreground)
 * across 5 tilesets, plus placed items and ghost overlay.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Canvas, Fill, useImage } from '@shopify/react-native-skia';
import TilemapRenderer from './TilemapRenderer';
import TentItemsRenderer from './TentItemsRenderer';
import GhostItemRenderer from './GhostItemRenderer';
import PlacementGridOverlay from './PlacementGridOverlay';
import { tentMap } from '../../services/world/tentMapLoader';
import { useTentStore } from '../../stores/tentStore';
import { useDecorateStore } from '../../stores/decorateStore';
import { resolveRoomStyleSelection, getSurfaceSheet } from '../../services/tent/tentSurfaceCatalog';
import {
  getTentSurfaceLayer,
  TENT_SURFACE_TILE_COLUMNS,
  TENT_SURFACE_TILE_COUNTS,
  TENT_SURFACE_TILE_SIZE,
} from '../../services/world/tentSurfaceTemplate';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  onReady?: () => void;
}

export default function TentInteriorScene({ onReady }: Props) {
  const currentRoomId = useTentStore((s) => s.currentRoomId);
  const roomStyleSelections = useTentStore((s) => s.roomStyleSelections);
  const previewRoomId = useDecorateStore((s) => s.previewRoomId);
  const previewFloorStyleId = useDecorateStore((s) => s.previewFloorStyleId);
  const previewWallStyleId = useDecorateStore((s) => s.previewWallStyleId);

  // Load all 5 tilesets
  const interiors = useImage(require('../../../assets/tiled/Interiors_16x16.png'));
  const roomBuilder = useImage(require('../../../assets/tiled/Room_Builder_16x16.png'));
  const interiorTiles = useImage(require('../../../assets/tiled/interior_tiles.png'));
  const interiorTilesRoof = useImage(require('../../../assets/tiled/interior_tiles_and_roof.png'));
  const interiorSprites = useImage(require('../../../assets/tiled/interior_sprites.png'));

  const resolvedRoomStyleSelection = useMemo(() => resolveRoomStyleSelection(
    currentRoomId,
    roomStyleSelections,
    {
      roomId: previewRoomId,
      floorStyleId: previewFloorStyleId,
      wallStyleId: previewWallStyleId,
    },
  ), [
    currentRoomId,
    roomStyleSelections,
    previewRoomId,
    previewFloorStyleId,
    previewWallStyleId,
  ]);

  const floorSheet = useImage(getSurfaceSheet(resolvedRoomStyleSelection.floorStyleId) as any);
  const wallSheet = useImage(getSurfaceSheet(resolvedRoomStyleSelection.wallStyleId) as any);

  const { width: mapW, height: mapH, tileWidth, tilesets, layers } = tentMap;

  // Scale: fit map width to screen width
  const { scale, offsetY } = useMemo(() => {
    const s = SCREEN_W / (mapW * tileWidth);
    const mapPixelH = mapH * tileWidth * s;
    const oY = (SCREEN_H - mapPixelH) / 2;
    return { scale: s, offsetY: oY };
  }, [mapW, mapH, tileWidth]);

  // Map tileset images to their metadata
  const tilesetImages = [interiors, roomBuilder, interiorTiles, interiorTilesRoof, interiorSprites];

  const allLoaded = tilesetImages.every((img) => !!img) && !!floorSheet && !!wallSheet;
  const firedRef = useRef(false);

  useEffect(() => {
    if (allLoaded && !firedRef.current) {
      firedRef.current = true;
      onReady?.();
    }
  }, [allLoaded, onReady]);

  if (!allLoaded) return null;

  const floorLayerData = getTentSurfaceLayer('floor');
  const wallLayerData = getTentSurfaceLayer('wall');

  // Render each layer across all tilesets
  const renderLayer = (layerData: number[]) => {
    return tilesets.map((ts, idx) => {
      const img = tilesetImages[idx];
      if (!img) return null;
      return (
        <TilemapRenderer
          key={`${ts.name}-${idx}`}
          tileset={img}
          tilesetColumns={ts.columns}
          tileWidth={ts.tileWidth}
          tileHeight={ts.tileHeight}
          mapWidth={mapW}
          mapHeight={mapH}
          data={layerData}
          scale={scale}
          offsetY={offsetY}
          screenHeight={SCREEN_H}
          firstGid={ts.firstGid}
          tileCount={ts.columns * Math.ceil(ts.imageHeight / ts.tileHeight)}
        />
      );
    });
  };

  const renderSurfaceLayer = (kind: 'floor' | 'wall') => {
    const surfaceSheet = kind === 'floor' ? floorSheet : wallSheet;
    if (!surfaceSheet) return null;

    return (
      <TilemapRenderer
        key={`surface-${kind}`}
        tileset={surfaceSheet}
        tilesetColumns={TENT_SURFACE_TILE_COLUMNS[kind]}
        tileWidth={TENT_SURFACE_TILE_SIZE}
        tileHeight={TENT_SURFACE_TILE_SIZE}
        mapWidth={mapW}
        mapHeight={mapH}
        data={kind === 'floor' ? floorLayerData : wallLayerData}
        scale={scale}
        offsetY={offsetY}
        screenHeight={SCREEN_H}
        firstGid={1}
        tileCount={TENT_SURFACE_TILE_COUNTS[kind]}
      />
    );
  };

  return (
    <Canvas style={styles.canvas}>
      <Fill color="#0A0A0B" />

      {/* Floor layer */}
      {renderSurfaceLayer('floor')}

      {/* Walls layer */}
      {renderSurfaceLayer('wall')}

      {/* Placed items (sorted by render plane, layer, and sprite foot depth) */}
      <TentItemsRenderer scale={scale} offsetY={offsetY} />

      {/* Ghost item being placed/moved */}
      <GhostItemRenderer scale={scale} offsetY={offsetY} />

      {/* Placement validity is shown via ghost item tint */}
      <PlacementGridOverlay />

      {/* Ceiling layer */}
      {renderLayer(layers.ceiling)}

      {/* Foreground layer (on top of everything) */}
      {renderLayer(layers.foreground)}
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    width: SCREEN_W,
    height: SCREEN_H,
  },
});
