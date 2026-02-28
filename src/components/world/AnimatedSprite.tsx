import React from 'react';
import {
  Group,
  Image,
  FilterMode,
  MipmapMode,
  rect,
  Skia,
} from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  useFrameCallback,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
  image: SkImage;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  fps?: number;
  x: SharedValue<number>;
  y: SharedValue<number>;
  width: number;
  height: number;
  isAnimating?: SharedValue<boolean>;
  flipX?: boolean;
  /** Number of columns in the spritesheet grid. Defaults to frameCount (single row). */
  columns?: number;
  /** Use nearest-neighbor filtering (pixel art). Defaults to true. Set false for smooth sprites. */
  nearestFilter?: boolean;
}

export default function AnimatedSprite({
  image,
  frameWidth,
  frameHeight,
  frameCount,
  fps = 8,
  x,
  y,
  width,
  height,
  isAnimating,
  flipX = false,
  columns,
  nearestFilter = true,
}: Props) {
  const cols = columns ?? frameCount; // default: single row
  const frameIndex = useSharedValue(0);
  const elapsed = useSharedValue(0);
  const frameDuration = 1000 / fps;

  useFrameCallback((info) => {
    if (info.timeSincePreviousFrame === null) return;
    if (isAnimating && !isAnimating.value) {
      frameIndex.value = 0;
      elapsed.value = 0;
      return;
    }
    elapsed.value += info.timeSincePreviousFrame;
    if (elapsed.value >= frameDuration) {
      elapsed.value -= frameDuration;
      frameIndex.value = (frameIndex.value + 1) % frameCount;
    }
  });

  // Clip to one frame's area at the animated position
  const clipRect = useDerivedValue(() => {
    return rect(x.value, y.value, width, height);
  });

  // Flip transform: scale -1 on X axis, pivot around sprite center
  // Reuse a single matrix to avoid GPU memory leak from creating one every frame
  const identityMatrix = React.useMemo(() => Skia.Matrix(), []);
  const flipMatrix = React.useMemo(() => Skia.Matrix(), []);
  const transform = useDerivedValue(() => {
    if (!flipX) return identityMatrix;
    const cx = x.value + width / 2;
    flipMatrix.identity();
    flipMatrix.translate(cx, 0);
    flipMatrix.scale(-1, 1);
    flipMatrix.translate(-cx, 0);
    return flipMatrix;
  });

  // Slide spritesheet so current frame aligns with clip window
  const imageX = useDerivedValue(() => {
    const col = frameIndex.value % cols;
    return x.value - col * width;
  });

  const imageY = useDerivedValue(() => {
    const row = Math.floor(frameIndex.value / cols);
    return y.value - row * height;
  });

  const rows = Math.ceil(frameCount / cols);
  const filterMode = nearestFilter ? FilterMode.Nearest : FilterMode.Linear;

  return (
    <Group clip={clipRect} matrix={transform}>
      <Image
        image={image}
        x={imageX}
        y={imageY}
        width={cols * width}
        height={rows * height}
        fit="fill"
        sampling={{ filter: filterMode, mipmap: MipmapMode.None }}
      />
    </Group>
  );
}
