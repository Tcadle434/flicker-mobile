import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  Canvas,
  FractalNoise,
  Fill,
  LinearGradient,
  vec,
  Rect,
} from '@shopify/react-native-skia';
import { theme } from '../../constants/theme';
import { useMoodTheme } from '../../hooks/useMoodTheme';

interface GlassCardProps {
  children: ReactNode;
  moodTint?: boolean;
  style?: ViewStyle;
  padding?: keyof typeof theme.spacing;
}

export function GlassCard({
  children,
  moodTint = false,
  style,
  padding = 'md',
}: GlassCardProps) {
  const moodTheme = useMoodTheme();

  return (
    <View
      style={[
        styles.base,
        { padding: theme.spacing[padding] },
        moodTint
          ? {
              backgroundColor: moodTheme.glass,
              borderColor: moodTheme.glassBorder,
              shadowColor: moodTheme.primary,
              shadowOpacity: 0.15,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 0 },
            }
          : styles.defaultGlass,
        style,
      ]}
    >
      {/* Skia frosted noise texture overlay */}
      <Canvas style={styles.noiseOverlay} pointerEvents="none">
        <Fill>
          <FractalNoise
            freqX={0.6}
            freqY={0.6}
            octaves={3}
            seed={42}
          />
        </Fill>
        {/* Gradient highlight: bright top fading to transparent */}
        <Rect x={0} y={0} width={400} height={60}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(0, 60)}
            colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.0)']}
          />
        </Rect>
      </Canvas>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  defaultGlass: {
    backgroundColor: theme.glassmorphism.light.backgroundColor,
    borderColor: theme.glassmorphism.light.borderColor,
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.015,
    borderRadius: theme.borderRadius.lg,
    pointerEvents: 'none',
  },
});
