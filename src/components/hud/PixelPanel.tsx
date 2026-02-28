/**
 * Pixel Panel
 *
 * Reusable pixel-art framed panel for popups, trays, and UI containers.
 * Uses ImageBackground to stretch the pixel art frame behind content.
 */

import React, { useState } from 'react';
import { ImageBackground, View, StyleSheet, type ViewStyle, type LayoutChangeEvent } from 'react-native';
import { HUD_ASSETS } from './hudAssets';

type PanelVariant = 1 | 2;

// Content insets as fraction of panel size — matches inner canvas of each art asset
// Variant 1 (component-background.png): canvas is ~25% in from sides, ~20% from top/bottom
const INSET_FRACTIONS: Record<PanelVariant, { top: number; bottom: number; left: number; right: number }> = {
  1: { top: 0.20, bottom: 0.20, left: 0.25, right: 0.25 },
  2: { top: 0.10, bottom: 0.10, left: 0.10, right: 0.10 },
};

interface Props {
  variant?: PanelVariant;
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function PixelPanel({ variant = 1, children, style }: Props) {
  const bgSource = variant === 2 ? HUD_ASSETS.componentBg2 : HUD_ASSETS.componentBg;
  const f = INSET_FRACTIONS[variant];
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  return (
    <ImageBackground
      source={bgSource}
      style={[styles.container, style]}
      resizeMode="stretch"
      onLayout={handleLayout}
    >
      {size && (
        <View
          style={{
            position: 'absolute',
            top: size.h * f.top,
            bottom: size.h * f.bottom,
            left: size.w * f.left,
            right: size.w * f.right,
          }}
        >
          {children}
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
