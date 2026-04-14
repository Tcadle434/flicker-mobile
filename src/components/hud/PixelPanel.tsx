/**
 * Pixel Panel — manual 9-slice renderer
 *
 * Uses the shared 48x48 source image as a 3x3 grid of 16x16 tiles.
 * Corners keep a fixed size, edges stretch along one axis, and the center
 * stretches to fill the remaining area.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Canvas,
  FilterMode,
  MipmapMode,
  Picture,
  Skia,
  useImage,
} from '@shopify/react-native-skia';
import { HUD_ASSETS } from './hudAssets';

const TILE_SIZE = 16;

interface Props {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scale?: number;
  inset?: number;
  source?: number;
}

export default function PixelPanel({
  children,
  style,
  scale = 1,
  inset = 4,
  source = HUD_ASSETS.panelSlice,
}: Props) {
  const image = useImage(source);
  const flattenedStyle = StyleSheet.flatten(style) ?? {};
  const [layoutSize, setLayoutSize] = useState(() => ({
    width: typeof flattenedStyle.width === 'number' ? flattenedStyle.width : 0,
    height: typeof flattenedStyle.height === 'number' ? flattenedStyle.height : 0,
  }));

  const width = Math.round(
    typeof flattenedStyle.width === 'number' ? flattenedStyle.width : layoutSize.width,
  );
  const height = Math.round(
    typeof flattenedStyle.height === 'number' ? flattenedStyle.height : layoutSize.height,
  );

  const cornerSize = Math.max(1, Math.round(TILE_SIZE * scale));
  const contentInset = Math.max(0, Math.round(inset * scale));

  const picture = useMemo(() => {
    if (!image || width <= 0 || height <= 0) {
      return null;
    }

    const leftWidth = Math.min(cornerSize, Math.floor(width / 2));
    const rightWidth = Math.min(cornerSize, width - leftWidth);
    const topHeight = Math.min(cornerSize, Math.floor(height / 2));
    const bottomHeight = Math.min(cornerSize, height - topHeight);
    const centerWidth = Math.max(0, width - leftWidth - rightWidth);
    const centerHeight = Math.max(0, height - topHeight - bottomHeight);

    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
    const paint = Skia.Paint();

    const drawSlice = (
      srcX: number,
      srcY: number,
      srcWidth: number,
      srcHeight: number,
      dstX: number,
      dstY: number,
      dstWidth: number,
      dstHeight: number,
    ) => {
      if (dstWidth <= 0 || dstHeight <= 0) {
        return;
      }

      canvas.drawImageRectOptions(
        image,
        Skia.XYWHRect(srcX, srcY, srcWidth, srcHeight),
        Skia.XYWHRect(dstX, dstY, dstWidth, dstHeight),
        FilterMode.Nearest,
        MipmapMode.None,
        paint,
      );
    };

    drawSlice(0, 0, TILE_SIZE, TILE_SIZE, 0, 0, leftWidth, topHeight);
    drawSlice(TILE_SIZE, 0, TILE_SIZE, TILE_SIZE, leftWidth, 0, centerWidth, topHeight);
    drawSlice(TILE_SIZE * 2, 0, TILE_SIZE, TILE_SIZE, width - rightWidth, 0, rightWidth, topHeight);

    drawSlice(0, TILE_SIZE, TILE_SIZE, TILE_SIZE, 0, topHeight, leftWidth, centerHeight);
    drawSlice(TILE_SIZE, TILE_SIZE, TILE_SIZE, TILE_SIZE, leftWidth, topHeight, centerWidth, centerHeight);
    drawSlice(
      TILE_SIZE * 2,
      TILE_SIZE,
      TILE_SIZE,
      TILE_SIZE,
      width - rightWidth,
      topHeight,
      rightWidth,
      centerHeight,
    );

    drawSlice(0, TILE_SIZE * 2, TILE_SIZE, TILE_SIZE, 0, height - bottomHeight, leftWidth, bottomHeight);
    drawSlice(
      TILE_SIZE,
      TILE_SIZE * 2,
      TILE_SIZE,
      TILE_SIZE,
      leftWidth,
      height - bottomHeight,
      centerWidth,
      bottomHeight,
    );
    drawSlice(
      TILE_SIZE * 2,
      TILE_SIZE * 2,
      TILE_SIZE,
      TILE_SIZE,
      width - rightWidth,
      height - bottomHeight,
      rightWidth,
      bottomHeight,
    );

    return recorder.finishRecordingAsPicture();
  }, [cornerSize, height, image, width]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = Math.round(event.nativeEvent.layout.width);
    const nextHeight = Math.round(event.nativeEvent.layout.height);

    if (nextWidth !== layoutSize.width || nextHeight !== layoutSize.height) {
      setLayoutSize({ width: nextWidth, height: nextHeight });
    }
  };

  return (
    <View onLayout={handleLayout} style={[styles.root, style]}>
      {picture && (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <Picture picture={picture} />
        </Canvas>
      )}
      <View style={[styles.content, { padding: contentInset }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
