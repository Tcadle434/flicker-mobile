import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { Fill, Group, Shader, Skia, rect } from '@shopify/react-native-skia';
import { useSharedValue, useFrameCallback, useDerivedValue } from 'react-native-reanimated';
import { rainShaderSource } from '../../shaders/rain';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  intensity?: number;
  speed?: number;
  angle?: number;
  mapOffsetY: number;
  mapHeight: number;
}

export default function RainOverlay({
  intensity = 0.6,
  speed = 1.0,
  angle = 0.15,
  mapOffsetY,
  mapHeight,
}: Props) {
  const effect = useMemo(() => Skia.RuntimeEffect.Make(rainShaderSource), []);

  const time = useSharedValue(0);

  useFrameCallback((info) => {
    if (info.timeSincePreviousFrame === null) return;
    time.value += info.timeSincePreviousFrame / 1000;
  });

  const uniforms = useDerivedValue(() => ({
    uTime: time.value,
    uResolution: [SCREEN_W, SCREEN_H],
    uIntensity: intensity,
    uSpeed: speed,
    uAngle: angle,
  }));

  const clipRect = useMemo(
    () => rect(0, mapOffsetY, SCREEN_W, mapHeight),
    [mapOffsetY, mapHeight],
  );

  if (!effect) return null;

  return (
    <Group clip={clipRect}>
      {/* Cloud cover darkening — subtle dark wash over the scene */}
      <Fill color="rgba(0, 5, 15, 0.18)" />
      {/* Rain streaks */}
      <Group blendMode="srcOver">
        <Fill>
          <Shader source={effect} uniforms={uniforms} />
        </Fill>
      </Group>
    </Group>
  );
}
