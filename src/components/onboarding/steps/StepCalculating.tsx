import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Fill, useImage } from '@shopify/react-native-skia';
import { useSharedValue } from 'react-native-reanimated';
import Animated, { useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedSprite from '../../world/AnimatedSprite';
import { ONBOARDING_ASSETS, FLICKER_FOCUS_META } from '../onboardingAssets';

const { width: SCREEN_W } = Dimensions.get('window');
const FLICKER_DISPLAY_W = SCREEN_W * 0.7;
const FLICKER_ASPECT = FLICKER_FOCUS_META.frameHeight / FLICKER_FOCUS_META.frameWidth;
const FLICKER_DISPLAY_H = FLICKER_DISPLAY_W * FLICKER_ASPECT;

const DURATION_MS = 3000;

interface Props { onNext: () => void; }

export default function StepCalculating({ onNext }: Props) {
  const insets = useSafeAreaInsets();
  const flickerSheet = useImage(ONBOARDING_ASSETS.flickerCalmFocus);
  const flickerX = useSharedValue((SCREEN_W - FLICKER_DISPLAY_W) / 2);
  const flickerY = useSharedValue(0);
  const [started, setStarted] = useState(false);

  const barStyle = useAnimatedStyle(() => ({
    width: started ? withTiming('100%', { duration: DURATION_MS, easing: Easing.inOut(Easing.cubic) }) : '0%',
  }));

  useEffect(() => {
    const kickoff = requestAnimationFrame(() => setStarted(true));
    const timer = setTimeout(onNext, DURATION_MS + 200);
    return () => {
      cancelAnimationFrame(kickoff);
      clearTimeout(timer);
    };
  }, [onNext]);

  const canvasH = FLICKER_DISPLAY_H;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.content}>
        {flickerSheet && (
          <Canvas style={[styles.canvas, { width: SCREEN_W, height: canvasH }]} pointerEvents="none">
            <Fill color="#F5F0EA" />
            <AnimatedSprite
              image={flickerSheet}
              frameWidth={FLICKER_FOCUS_META.frameWidth}
              frameHeight={FLICKER_FOCUS_META.frameHeight}
              frameCount={FLICKER_FOCUS_META.frameCount}
              fps={FLICKER_FOCUS_META.fps}
              columns={FLICKER_FOCUS_META.columns}
              x={flickerX}
              y={flickerY}
              width={FLICKER_DISPLAY_W}
              height={FLICKER_DISPLAY_H}
            />
          </Canvas>
        )}

        <Text style={styles.label}>Calculating...</Text>

        <View style={styles.trackOuter}>
          <View style={styles.track}>
            <Animated.View style={[styles.fill, barStyle]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0EA',
    paddingHorizontal: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvas: {
    marginBottom: 32,
  },
  label: {
    color: 'rgba(0, 0, 0, 0.4)',
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 24,
  },
  trackOuter: {
    width: '60%',
  },
  track: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: '#1A1A1A',
  },
});
