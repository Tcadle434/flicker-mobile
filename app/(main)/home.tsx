import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, useSharedValue, withTiming, runOnJS, Easing } from 'react-native-reanimated';
import OverworldScene, { AmbientEffect, getTentScreenRect } from '../../src/components/world/OverworldScene';
import { HudOverlay, SessionPanel } from '../../src/components/hud';
import { forestMap } from '../../src/services/world/tiledMapLoader';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const EFFECT_OPTIONS: { label: string; value: AmbientEffect }[] = [
  { label: 'Off', value: 'none' },
  { label: 'Rain', value: 'rain' },
  { label: 'Fireflies', value: 'fireflies' },
  { label: 'Wind', value: 'wind' },
  { label: 'Snow', value: 'snow' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ambientEffect, setAmbientEffect] = useState<AmbientEffect>('rain');
  const [sessionPanelVisible, setSessionPanelVisible] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const handleReady = useCallback(() => setReady(true), []);

  // Zoom shared values
  const zoomScale = useSharedValue(1);
  const zoomTranslateX = useSharedValue(0);
  const zoomTranslateY = useSharedValue(0);

  // Compute tent screen rect for tap target
  const { scale, offsetY } = useMemo(() => {
    const { width: mapW, height: mapH, tileWidth } = forestMap;
    const s = SCREEN_W / (mapW * tileWidth);
    const oY = (SCREEN_H - mapH * tileWidth * s) / 2;
    return { scale: s, offsetY: oY };
  }, []);

  const tentRect = useMemo(
    () => getTentScreenRect(scale, offsetY, forestMap.tileWidth),
    [scale, offsetY],
  );

  // Zoom animation → navigate to tent
  const zoomToTent = useCallback(
    (decorate: boolean) => {
      if (isZooming) return;
      setIsZooming(true);

      // Target: zoom 3x into tent door center (bottom center of tent sprite)
      const targetScale = 3;
      const tentCenterX = tentRect.x + tentRect.width / 2;
      const tentBottomY = tentRect.y + tentRect.height * 0.8;

      // Translate so that tentCenter ends up at screen center after scaling
      const tx = SCREEN_W / 2 - tentCenterX * targetScale;
      const ty = SCREEN_H / 2 - tentBottomY * targetScale;

      const timing = { duration: 350, easing: Easing.inOut(Easing.cubic) };

      const navigateToTent = () => {
        router.push(decorate ? '/(main)/tent?decorate=1' : '/(main)/tent');
        // Reset zoom after navigation (next frame)
        setTimeout(() => {
          zoomScale.value = 1;
          zoomTranslateX.value = 0;
          zoomTranslateY.value = 0;
          setIsZooming(false);
        }, 100);
      };

      zoomScale.value = withTiming(targetScale, timing);
      zoomTranslateX.value = withTiming(tx, timing);
      zoomTranslateY.value = withTiming(ty, timing, () => {
        runOnJS(navigateToTent)();
      });
    },
    [isZooming, tentRect, router, zoomScale, zoomTranslateX, zoomTranslateY],
  );

  const handleTentTap = useCallback(() => zoomToTent(false), [zoomToTent]);
  const handleDecorate = useCallback(() => zoomToTent(true), [zoomToTent]);
  const handleOpenShop = useCallback(() => {
    if (isZooming) return;
    setIsZooming(true);

    const targetScale = 3;
    const tentCenterX = tentRect.x + tentRect.width / 2;
    const tentBottomY = tentRect.y + tentRect.height * 0.8;
    const tx = SCREEN_W / 2 - tentCenterX * targetScale;
    const ty = SCREEN_H / 2 - tentBottomY * targetScale;
    const timing = { duration: 350, easing: Easing.inOut(Easing.cubic) };

    const navigateToTent = () => {
      router.push('/(main)/tent?shop=1');
      setTimeout(() => {
        zoomScale.value = 1;
        zoomTranslateX.value = 0;
        zoomTranslateY.value = 0;
        setIsZooming(false);
      }, 100);
    };

    zoomScale.value = withTiming(targetScale, timing);
    zoomTranslateX.value = withTiming(tx, timing);
    zoomTranslateY.value = withTiming(ty, timing, () => {
      runOnJS(navigateToTent)();
    });
  }, [isZooming, tentRect, router, zoomScale, zoomTranslateX, zoomTranslateY]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Scene renders underneath — hidden via opacity until all images loaded */}
      <View style={ready ? styles.sceneVisible : styles.sceneHidden}>
        <OverworldScene
          onReady={handleReady}
          ambientEffect={ambientEffect}
          zoomScale={zoomScale}
          zoomTranslateX={zoomTranslateX}
          zoomTranslateY={zoomTranslateY}
        />
      </View>

      {/* Loading overlay — removed once scene is ready */}
      {!ready && (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

      {/* Fade-in overlay that reveals the scene */}
      {ready && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}

      {/* Tent tap target — invisible pressable over tent sprite */}
      {ready && !isZooming && (
        <Pressable
          onPress={handleTentTap}
          style={[
            styles.tentTap,
            {
              left: tentRect.x,
              top: tentRect.y,
              width: tentRect.width,
              height: tentRect.height,
            },
          ]}
        />
      )}

      {/* Effect switcher pills — hidden for now, always rain */}
      {/* {ready && (
        <View style={styles.switcherRow}>
          {EFFECT_OPTIONS.map((opt) => {
            const active = ambientEffect === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setAmbientEffect(opt.value)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )} */}

      {/* HUD overlay + Session panel */}
      {ready && !isZooming && (
        <HudOverlay
          onStartSession={() => setSessionPanelVisible(true)}
          onDecorate={handleDecorate}
          onEnterTent={handleTentTap}
          onOpenShop={handleOpenShop}
        />
      )}
      {ready && (
        <SessionPanel
          visible={sessionPanelVisible}
          onClose={() => setSessionPanelVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  sceneVisible: {
    ...StyleSheet.absoluteFillObject,
  },
  sceneHidden: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '300',
    letterSpacing: 1,
  },
  tentTap: {
    position: 'absolute',
  },
  switcherRow: {
    position: 'absolute',
    top: 56,
    right: 16,
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  pillText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#0A0A0B',
  },
});
