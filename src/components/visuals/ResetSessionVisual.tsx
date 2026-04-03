import React from 'react';
import { useWindowDimensions, StyleSheet } from 'react-native';
import { Canvas, useImage } from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import AnimatedSprite from '../world/AnimatedSprite';

const FRAME_WIDTH = 512;
const FRAME_HEIGHT = 293;
const FRAME_COUNT = 61;
const COLUMNS = 8;
const FPS = 12;

export default function ResetSessionVisual() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const image = useImage(require('../../../assets/sprites/flicker_calm_meditate.png'));

  // Size sprite to ~80% screen width, maintain aspect ratio
  const spriteWidth = screenWidth * 0.8;
  const aspectRatio = FRAME_HEIGHT / FRAME_WIDTH;
  const spriteHeight = spriteWidth * aspectRatio;

  // Center horizontally, slightly above vertical center
  const spriteX = useSharedValue((screenWidth - spriteWidth) / 2);
  const spriteY = useSharedValue((screenHeight - spriteHeight) / 2 - screenHeight * 0.05);

  if (!image) return null;

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <AnimatedSprite
        image={image}
        frameWidth={FRAME_WIDTH}
        frameHeight={FRAME_HEIGHT}
        frameCount={FRAME_COUNT}
        columns={COLUMNS}
        fps={FPS}
        x={spriteX}
        y={spriteY}
        width={spriteWidth}
        height={spriteHeight}
        nearestFilter={false}
      />
    </Canvas>
  );
}
