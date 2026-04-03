import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { Fill, Group, Shader, Skia, rect } from '@shopify/react-native-skia';
import { useSharedValue, useFrameCallback, useDerivedValue } from 'react-native-reanimated';
import { snowShaderSource } from '../../shaders/snow';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  intensity?: number;
  speed?: number;
  mapOffsetY: number;
  mapHeight: number;
}

export default function SnowOverlay({
  intensity = 0.6,
  speed = 1.0,
  mapOffsetY,
  mapHeight,
}: Props) {
  const effect = useMemo(() => Skia.RuntimeEffect.Make(snowShaderSource), []);

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
  }));

  const clipRect = useMemo(
    () => rect(0, mapOffsetY, SCREEN_W, mapHeight),
    [mapOffsetY, mapHeight],
  );

  if (!effect) return null;

  return (
    <Group clip={clipRect}>
      {/* Subtle cold atmospheric tint */}
      <Fill color="rgba(10, 10, 20, 0.08)" />
      {/* Snowflakes */}
      <Group blendMode="srcOver">
        <Fill>
          <Shader source={effect} uniforms={uniforms} />
        </Fill>
      </Group>
    </Group>
  );
}
