import React, { useMemo } from 'react';
import { Dimensions } from 'react-native';
import { Fill, Group, Shader, Skia, rect } from '@shopify/react-native-skia';
import { useSharedValue, useFrameCallback, useDerivedValue } from 'react-native-reanimated';
import { rainShaderSource } from '../../shaders/rain';
import { rainSplashShaderSource } from '../../shaders/rainSplash';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  intensity?: number;
  speed?: number;
  angle?: number;
  showSplashes?: boolean;
  mapOffsetY: number;
  mapHeight: number;
}

export default function RainOverlay({
  intensity = 0.6,
  speed = 1.0,
  angle = 0.15,
  showSplashes = true,
  mapOffsetY,
  mapHeight,
}: Props) {
  const rainEffect = useMemo(() => Skia.RuntimeEffect.Make(rainShaderSource), []);
  const splashEffect = useMemo(
    () => (showSplashes ? Skia.RuntimeEffect.Make(rainSplashShaderSource) : null),
    [showSplashes],
  );

  const time = useSharedValue(0);

  useFrameCallback((info) => {
    if (info.timeSincePreviousFrame === null) return;
    time.value += info.timeSincePreviousFrame / 1000;
  });

  const rainUniforms = useDerivedValue(() => ({
    uTime: time.value,
    uResolution: [SCREEN_W, SCREEN_H],
    uIntensity: intensity,
    uSpeed: speed,
    uAngle: angle,
  }));

  const groundTop = mapOffsetY + mapHeight * 0.25;

  const splashUniforms = useDerivedValue(() => ({
    uTime: time.value,
    uResolution: [SCREEN_W, SCREEN_H],
    uIntensity: intensity,
    uGroundTop: groundTop,
  }));

  const clipRect = useMemo(
    () => rect(0, mapOffsetY, SCREEN_W, mapHeight),
    [mapOffsetY, mapHeight],
  );
  const splashClipRect = useMemo(
    () => rect(0, groundTop, SCREEN_W, Math.max(0, mapOffsetY + mapHeight - groundTop)),
    [groundTop, mapHeight, mapOffsetY],
  );

  if (!rainEffect || (showSplashes && !splashEffect)) return null;

  return (
    <Group clip={clipRect}>
      {/* Cloud cover darkening — subtle dark wash over the scene */}
      <Fill color="rgba(0, 5, 15, 0.18)" />
      {/* Rain streaks */}
      <Group blendMode="srcOver">
        <Fill>
          <Shader source={rainEffect} uniforms={rainUniforms} />
        </Fill>
      </Group>
      {showSplashes && splashEffect && (
        <Group clip={splashClipRect} blendMode="srcOver">
          <Fill>
            <Shader source={splashEffect} uniforms={splashUniforms} />
          </Fill>
        </Group>
      )}
    </Group>
  );
}
