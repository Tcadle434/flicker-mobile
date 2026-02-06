import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, PixelRatio } from 'react-native';
import { Canvas, Skia, Shader, Fill } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  useFrameCallback,
} from 'react-native-reanimated';
import { MoodState, moodThemes } from '../../constants/moodThemes';
import { atmosphericBackgroundShader } from '../../shaders/atmosphericBackground.sksl';

interface AtmosphericBackgroundProps {
  mood: MoodState;
  intensity?: number;
}

export function AtmosphericBackground({
  mood,
  intensity,
}: AtmosphericBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const pd = PixelRatio.get();

  const effect = useMemo(() => {
    const rt = Skia.RuntimeEffect.Make(atmosphericBackgroundShader);
    if (!rt) {
      console.warn('AtmosphericBackground: SKSL shader compilation failed');
    }
    return rt;
  }, []);

  const time = useSharedValue(5);

  useFrameCallback((info) => {
    // Accumulate delta so re-renders never reset the flow
    time.value += (info.timeSincePreviousFrame ?? 0) / 1000;
  });

  const moodConfig = moodThemes[mood];
  const tintIntensity = intensity ?? moodConfig.bgTintIntensity;

  const uniforms = useDerivedValue(() => ({
    uTime: time.value,
    uResolution: [width * pd, height * pd],
    uMoodTint: moodConfig.bgTint,
    uMoodIntensity: tintIntensity,
  }));

  if (!effect) {
    // Graceful fallback: transparent layer so layout is unaffected
    return null;
  }

  return (
    <Canvas style={[StyleSheet.absoluteFill, styles.canvas]} opaque>
      <Fill>
        <Shader source={effect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  canvas: {
    pointerEvents: 'none',
  },
});
