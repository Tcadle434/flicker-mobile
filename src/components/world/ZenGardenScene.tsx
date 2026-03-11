import React, { useEffect, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Canvas, Fill, Rect, LinearGradient, vec, useImage } from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import TilemapRenderer from './TilemapRenderer';
import AnimatedSprite from './AnimatedSprite';
import { zenGardenMap } from '../../services/world/zenGardenLoader';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Flicker meditate sprite constants
const FRAME_WIDTH = 512;
const FRAME_HEIGHT = 293;
const FRAME_COUNT = 61;
const COLUMNS = 8;
const FPS = 12;

// Flicker position on the map (tile coords)
const FLICKER_TILE_X = 24;
const FLICKER_TILE_Y = 62;
const FLICKER_DISPLAY_TILES = 14;

interface Props {
  onReady?: () => void;
}

export default function ZenGardenScene({ onReady }: Props) {
  const tileset = useImage(require('../../../assets/tiled/zen-garden-tileset.png'));
  const meditateSheet = useImage(require('../../../assets/sprites/flicker_calm_meditate.png'));

  const { width: mapWidth, height: mapHeight, tileWidth } = zenGardenMap;

  const { scale, offsetY, mapPixelH } = useMemo(() => {
    const s = SCREEN_W / (mapWidth * tileWidth);
    const mph = mapHeight * tileWidth * s;
    const oY = (SCREEN_H - mph) / 2;
    return { scale: s, offsetY: oY, mapPixelH: mph };
  }, [mapWidth, mapHeight, tileWidth]);

  // Flicker display size (~10 tiles tall, maintain aspect ratio)
  const flickerHeight = FLICKER_DISPLAY_TILES * tileWidth * scale;
  const flickerWidth = flickerHeight * (FRAME_WIDTH / FRAME_HEIGHT);

  // Screen position (centered on anchor tile)
  const flickerX = useSharedValue(
    FLICKER_TILE_X * tileWidth * scale - flickerWidth / 2,
  );
  const flickerY = useSharedValue(
    offsetY + FLICKER_TILE_Y * tileWidth * scale - flickerHeight / 2,
  );

  const allLoaded = !!tileset && !!meditateSheet;
  const firedRef = useRef(false);

  useEffect(() => {
    if (allLoaded && !firedRef.current) {
      firedRef.current = true;
      onReady?.();
    }
  }, [allLoaded, onReady]);

  if (!allLoaded) return null;

  return (
    <Canvas style={styles.canvas}>
      {/* Solid dark background */}
      <Fill color="#0A0A0B" />

      {/* Zen garden tilemap */}
      <TilemapRenderer
        tileset={tileset}
        tilesetColumns={zenGardenMap.tilesetColumns}
        tileWidth={zenGardenMap.tileWidth}
        tileHeight={zenGardenMap.tileHeight}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        data={zenGardenMap.data}
        scale={scale}
        offsetY={offsetY}
        screenHeight={SCREEN_H}
      />

      {/* Dark meditative dim overlay */}
      <Rect x={0} y={0} width={SCREEN_W} height={SCREEN_H} color="rgba(0,0,0,0.7)" />

      {/* Flicker meditating (rendered above dim so character stays bright) */}
      <AnimatedSprite
        image={meditateSheet}
        frameWidth={FRAME_WIDTH}
        frameHeight={FRAME_HEIGHT}
        frameCount={FRAME_COUNT}
        columns={COLUMNS}
        fps={FPS}
        x={flickerX}
        y={flickerY}
        width={flickerWidth}
        height={flickerHeight}
        nearestFilter={false}
      />

      {/* Top vignette */}
      <Rect x={0} y={0} width={SCREEN_W} height={offsetY + 80}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, offsetY + 80)}
          colors={['#0A0A0B', '#0A0A0B', '#0A0A0B00']}
          positions={[0, 0.5, 1]}
        />
      </Rect>

      {/* Bottom vignette */}
      <Rect x={0} y={offsetY + mapPixelH - 100} width={SCREEN_W} height={100}>
        <LinearGradient
          start={vec(0, offsetY + mapPixelH - 100)}
          end={vec(0, offsetY + mapPixelH)}
          colors={['#0A0A0B00', '#0A0A0B']}
        />
      </Rect>
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
