import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Canvas,
  FractalNoise,
  Fill,
  LinearGradient,
  Rect,
  vec,
} from '@shopify/react-native-skia';
import { useMoodTheme } from '../../hooks/useMoodTheme';
import { theme } from '../../constants/theme';

const DURATIONS = [3, 5, 15] as const;
type Duration = (typeof DURATIONS)[number];

interface DurationSelectorProps {
  value: Duration;
  onChange: (duration: Duration) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  const moodTheme = useMoodTheme();

  return (
    <View style={styles.row}>
      {DURATIONS.map((minutes) => {
        const active = value === minutes;
        return (
          <TouchableOpacity
            key={minutes}
            style={[
              styles.chip,
              active
                ? {
                    borderColor: moodTheme.primary,
                    backgroundColor: `${moodTheme.primary}18`,
                    shadowColor: moodTheme.primary,
                    shadowOpacity: 0.35,
                    shadowRadius: 14,
                    shadowOffset: { width: 0, height: 0 },
                  }
                : {
                    borderColor: 'rgba(255,255,255,0.15)',
                    backgroundColor: 'rgba(255,255,255,0.12)',
                  },
            ]}
            onPress={() => onChange(minutes)}
            activeOpacity={0.7}
          >
            {/* Skia frosted texture + gradient highlight */}
            <Canvas style={styles.noiseOverlay} pointerEvents="none">
              <Fill>
                <FractalNoise freqX={0.6} freqY={0.6} octaves={3} seed={minutes} />
              </Fill>
              <Rect x={0} y={0} width={200} height={24}>
                <LinearGradient
                  start={vec(0, 0)}
                  end={vec(0, 24)}
                  colors={[
                    active
                      ? `${moodTheme.primary}20`
                      : 'rgba(255,255,255,0.06)',
                    'rgba(255,255,255,0.0)',
                  ]}
                />
              </Rect>
            </Canvas>
            <Text
              style={[
                styles.chipText,
                active && { color: moodTheme.primary, fontWeight: '600' as const },
              ]}
            >
              {minutes} min
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export type { Duration };

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  chip: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  noiseOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.015,
    borderRadius: theme.borderRadius.xl,
    pointerEvents: 'none',
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
