import React, { useCallback, useMemo, useState } from 'react';
import { useImage } from '@shopify/react-native-skia';
import {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import AnimatedSprite from './AnimatedSprite';
import type { Direction } from './useGridWander';

const FLICKER_FRAME_W = 128;
const FLICKER_FRAME_H = 128;
const FLICKER_FRAME_COUNT = 5;
const FLICKER_DISPLAY_TILES = 3.25;
const FLICKER_FPS = 3;

interface Props {
  tileX: SharedValue<number>;
  tileY: SharedValue<number>;
  isMoving: SharedValue<boolean>;
  facing: SharedValue<Direction>;
  scale: number;
  offsetY: number;
  tileWidth: number;
  tileHeight: number;
  active: boolean;
  clock: SharedValue<number>;
}

export default function TentFlickerRenderer({
  tileX,
  tileY,
  isMoving,
  facing,
  scale,
  offsetY,
  tileWidth,
  tileHeight,
  active,
  clock,
}: Props) {
  const flickerSouth = useImage(require('../../../assets/sprites/flicker-calm-walk-south.png'));
  const flickerEast = useImage(require('../../../assets/sprites/flicker-calm-walk-east.png'));
  const flickerNorth = useImage(require('../../../assets/sprites/flicker-calm-walk-north.png'));

  const [currentFacing, setCurrentFacing] = useState<Direction>('south');

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
  const flickerSize = FLICKER_DISPLAY_TILES * tileWidth * scale;

  const screenX = useDerivedValue(() => (
    (tileX.value + 0.5) * tileWidth * scale - flickerSize / 2
  ));
  const screenY = useDerivedValue(() => (
    offsetY + (tileY.value + 1) * tileHeight * scale - flickerSize
  ));

  if (!flickerSouth || !flickerEast || !flickerNorth) return null;

  return (
    <AnimatedSprite
      image={flickerImage ?? flickerSouth}
      frameWidth={FLICKER_FRAME_W}
      frameHeight={FLICKER_FRAME_H}
      frameCount={FLICKER_FRAME_COUNT}
      fps={FLICKER_FPS}
      x={screenX}
      y={screenY}
      width={flickerSize}
      height={flickerSize}
      isAnimating={isMoving}
      flipX={flickerFlipX}
      active={active}
      clock={clock}
    />
  );
}
