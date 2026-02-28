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

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  onReady?: () => void;
}

export default function TentInteriorScene({ onReady }: Props) {
  // Load all 5 tilesets
  const interiors = useImage(require('../../../assets/tiled/Interiors_16x16.png'));
  const roomBuilder = useImage(require('../../../assets/tiled/Room_Builder_16x16.png'));
  const interiorTiles = useImage(require('../../../assets/tiled/interior_tiles.png'));
  const interiorTilesRoof = useImage(require('../../../assets/tiled/interior_tiles_and_roof.png'));
  const interiorSprites = useImage(require('../../../assets/tiled/interior_sprites.png'));

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

  const allLoaded = tilesetImages.every((img) => !!img);
  const firedRef = useRef(false);

  useEffect(() => {
    if (allLoaded && !firedRef.current) {
      firedRef.current = true;
      onReady?.();
    }
  }, [allLoaded, onReady]);

  if (!allLoaded) return null;

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

  return (
    <Canvas style={styles.canvas}>
      <Fill color="#0A0A0B" />

      {/* Floor layer */}
      {renderLayer(layers.floor)}

      {/* Walls layer */}
      {renderLayer(layers.walls)}

      {/* Placed items (sorted by tileY for depth) */}
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
