import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { Canvas, Fill, Group, Rect, LinearGradient, vec, useImage, Skia } from '@shopify/react-native-skia';
import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import TilemapRenderer from './TilemapRenderer';
import SpriteRenderer from './SpriteRenderer';
import AnimatedSprite from './AnimatedSprite';
import RainOverlay from './RainOverlay';
import FirefliesOverlay from './FirefliesOverlay';
import WindOverlay from './WindOverlay';
import SnowOverlay from './SnowOverlay';
import useFlickerWander, { type Direction } from './useFlickerWander';
import { forestMap } from '../../services/world/tiledMapLoader';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Tent sprite constants
const TENT_TILE_X = 18;
const TENT_TILE_Y = 37;
const TENT_NATIVE_W = 208;
const TENT_NATIVE_H = 176;

// Flicker sprite constants
const FLICKER_FRAME_W = 128;
const FLICKER_FRAME_H = 128;
const FLICKER_FRAME_COUNT = 5;
const FLICKER_START_TILE_X = 24; // Center of clearing
const FLICKER_START_TILE_Y = 50;
const FLICKER_DISPLAY_TILES = 10; // Flicker spans ~10 tiles tall on screen

// Campfire sprite constants
const CAMPFIRE_FRAME_W = 64;
const CAMPFIRE_FRAME_H = 64;
const CAMPFIRE_FRAME_COUNT = 17;
const CAMPFIRE_TILE_X = 20;
const CAMPFIRE_TILE_Y = 48;
const CAMPFIRE_DISPLAY_TILES = 4;

export type AmbientEffect = 'none' | 'rain' | 'fireflies' | 'wind' | 'snow';

// Export tent screen rect calculation for tap target positioning
export function getTentScreenRect(scale: number, offsetY: number, tileWidth: number) {
  return {
    x: TENT_TILE_X * tileWidth * scale,
    y: offsetY + TENT_TILE_Y * tileWidth * scale,
    width: TENT_NATIVE_W * scale,
    height: TENT_NATIVE_H * scale,
  };
}

interface Props {
  onReady?: () => void;
  ambientEffect?: AmbientEffect;
  /** Shared zoom values for tent transition */
  zoomScale?: { value: number };
  zoomTranslateX?: { value: number };
  zoomTranslateY?: { value: number };
}

export default function OverworldScene({
  onReady,
  ambientEffect = 'none',
  zoomScale,
  zoomTranslateX,
  zoomTranslateY,
}: Props) {
  const tileset = useImage(require('../../../assets/tiled/flicker-forest.png'));
  const tentImage = useImage(require('../../../assets/sprites/flicker-tent-exterior.png'));
  const flickerSouth = useImage(require('../../../assets/sprites/flicker-calm-walk-south.png'));
  const flickerEast = useImage(require('../../../assets/sprites/flicker-calm-walk-east.png'));
  const flickerNorth = useImage(require('../../../assets/sprites/flicker-calm-walk-north.png'));
  const campfireSheet = useImage(require('../../../assets/sprites/campfire.png'));

  const { width: mapWidth, height: mapHeight, tileWidth } = forestMap;

  const { scale, offsetY, mapPixelH } = useMemo(() => {
    const s = SCREEN_W / (mapWidth * tileWidth);
    const mph = mapHeight * tileWidth * s;
    const oY = (SCREEN_H - mph) / 2;
    return { scale: s, offsetY: oY, mapPixelH: mph };
  }, [mapWidth, mapHeight, tileWidth]);

  // Flicker display size (constant)
  const flickerSize = FLICKER_DISPLAY_TILES * tileWidth * scale;

  // Wandering system — returns animated tile positions + facing direction
  const { tileX, tileY, isMoving, facing } = useFlickerWander(
    FLICKER_START_TILE_X,
    FLICKER_START_TILE_Y,
  );
  const [currentFacing, setCurrentFacing] = useState<Direction>('south');

  // Convert tile positions to screen positions (centered on Flicker)
  const screenX = useDerivedValue(() => {
    return tileX.value * tileWidth * scale - flickerSize / 2;
  });
  const screenY = useDerivedValue(() => {
    return offsetY + tileY.value * tileWidth * scale - flickerSize / 2;
  });

  const syncFacing = useCallback((nextFacing: Direction) => {
    setCurrentFacing((current) => (current === nextFacing ? current : nextFacing));
  }, []);

  useAnimatedReaction(
    () => facing.value,
    (nextFacing, previousFacing) => {
      if (nextFacing !== previousFacing) {
        runOnJS(syncFacing)(nextFacing);
      }
    },
    [syncFacing],
  );

  const flickerImage = useMemo(() => {
    if (currentFacing === 'north') return flickerNorth;
    if (currentFacing === 'east' || currentFacing === 'west') return flickerEast;
    return flickerSouth;
  }, [currentFacing, flickerEast, flickerNorth, flickerSouth]);

  const flickerFlipX = currentFacing === 'west';

  // Campfire screen position (static)
  const campfireSize = CAMPFIRE_DISPLAY_TILES * tileWidth * scale;
  const campfireX = useSharedValue(CAMPFIRE_TILE_X * tileWidth * scale - campfireSize / 2);
  const campfireY = useSharedValue(offsetY + CAMPFIRE_TILE_Y * tileWidth * scale - campfireSize / 2);

  // Zoom transform matrix for tent transition
  // Reuse a single matrix to avoid GPU memory leak from creating one every frame
  const zoomMatrixRef = useMemo(() => Skia.Matrix(), []);
  const zoomMatrix = useDerivedValue(() => {
    const s = zoomScale?.value ?? 1;
    const tx = zoomTranslateX?.value ?? 0;
    const ty = zoomTranslateY?.value ?? 0;
    zoomMatrixRef.identity();
    if (s !== 1 || tx !== 0 || ty !== 0) {
      zoomMatrixRef.translate(tx, ty);
      zoomMatrixRef.scale(s, s);
    }
    return zoomMatrixRef;
  });

  const allLoaded = !!tileset && !!tentImage && !!flickerSouth && !!flickerEast && !!flickerNorth && !!campfireSheet;
  const firedRef = useRef(false);

  useEffect(() => {
    if (allLoaded && !firedRef.current) {
      firedRef.current = true;
      onReady?.();
    }
  }, [allLoaded, onReady]);

  if (!allLoaded) return null;

  const activeFlickerImage = flickerImage ?? flickerSouth;

  return (
    <Canvas style={styles.canvas}>
      <Fill color="#0A0A0B" />
      <Group matrix={zoomMatrix}>
      <TilemapRenderer
        tileset={tileset}
        tilesetColumns={forestMap.tilesetColumns}
        tileWidth={forestMap.tileWidth}
        tileHeight={forestMap.tileHeight}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        data={forestMap.data}
        scale={scale}
        offsetY={offsetY}
        screenHeight={SCREEN_H}
      />
      <SpriteRenderer
        image={tentImage}
        tileX={TENT_TILE_X}
        tileY={TENT_TILE_Y}
        spriteWidth={TENT_NATIVE_W}
        spriteHeight={TENT_NATIVE_H}
        scale={scale}
        offsetY={offsetY}
      />
      <AnimatedSprite
        image={campfireSheet}
        frameWidth={CAMPFIRE_FRAME_W}
        frameHeight={CAMPFIRE_FRAME_H}
        frameCount={CAMPFIRE_FRAME_COUNT}
        fps={8}
        x={campfireX}
        y={campfireY}
        width={campfireSize}
        height={campfireSize}
      />
      <AnimatedSprite
        image={activeFlickerImage}
        frameWidth={FLICKER_FRAME_W}
        frameHeight={FLICKER_FRAME_H}
        frameCount={FLICKER_FRAME_COUNT}
        fps={3}
        x={screenX}
        y={screenY}
        width={flickerSize}
        height={flickerSize}
        isAnimating={isMoving}
        flipX={flickerFlipX}
      />
      {ambientEffect === 'rain' && <RainOverlay mapOffsetY={offsetY} mapHeight={mapPixelH} />}
      {ambientEffect === 'fireflies' && <FirefliesOverlay mapOffsetY={offsetY} mapHeight={mapPixelH} />}
      {ambientEffect === 'wind' && <WindOverlay mapOffsetY={offsetY} mapHeight={mapPixelH} />}
      {ambientEffect === 'snow' && <SnowOverlay mapOffsetY={offsetY} mapHeight={mapPixelH} />}

      {/* Top vignette: covers the full black bar + bleeds into map */}
      <Rect x={0} y={0} width={SCREEN_W} height={offsetY + 80}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(0, offsetY + 80)}
          colors={['#0A0A0B', '#0A0A0B', '#0A0A0B00']}
          positions={[0, 0.5, 1]}
        />
      </Rect>
      {/* Bottom vignette: transparent → dark over bottom edge of map */}
      <Rect x={0} y={offsetY + mapPixelH - 100} width={SCREEN_W} height={100}>
        <LinearGradient
          start={vec(0, offsetY + mapPixelH - 100)}
          end={vec(0, offsetY + mapPixelH)}
          colors={['#0A0A0B00', '#0A0A0B']}
        />
      </Rect>
      </Group>
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
