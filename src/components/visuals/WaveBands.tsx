import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useMoodTheme } from '../../hooks/useMoodTheme';

const BAND_COUNT = 7;

function WaveBand({ index, color }: { index: number; color: string }) {
  const opacity = useSharedValue(0.06);

  useEffect(() => {
    const delay = index * 500;
    const duration = 3500 + index * 400;

    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.18 + index * 0.02, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      ),
    );
  }, [index, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const top = `${8 + index * 12}%` as const;

  return (
    <Animated.View
      style={[
        styles.band,
        animatedStyle,
        {
          top,
          backgroundColor: color,
          height: 100 + index * 15,
        },
      ]}
    />
  );
}

export function WaveBands() {
  const moodTheme = useMoodTheme();

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Subtle radial gradient feel via layered circles */}
      <View style={[styles.radialGlow, { backgroundColor: moodTheme.backgroundPulse }]} />
      <View style={[styles.radialGlowInner, { backgroundColor: moodTheme.backgroundPulse }]} />
      {Array.from({ length: BAND_COUNT }).map((_, i) => (
        <WaveBand key={i} index={i} color={moodTheme.primary} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  radialGlow: {
    position: 'absolute',
    top: '20%',
    left: '-20%',
    width: '140%',
    height: '60%',
    borderRadius: 9999,
    opacity: 0.4,
  },
  radialGlowInner: {
    position: 'absolute',
    top: '30%',
    left: '5%',
    width: '90%',
    height: '40%',
    borderRadius: 9999,
    opacity: 0.25,
  },
  band: {
    position: 'absolute',
    left: '-10%',
    right: '-10%',
    borderRadius: 100,
  },
});
