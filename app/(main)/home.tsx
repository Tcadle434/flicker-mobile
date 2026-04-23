import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, useSharedValue, withTiming, runOnJS, Easing } from 'react-native-reanimated';
import OverworldScene, { getTentScreenRect } from '../../src/components/world/OverworldScene';
import { HudOverlay, SessionPanel, SessionCompletePopup } from '../../src/components/hud';
import SettingsPanel from '../../src/components/hud/SettingsPanel';
import StreakPanel from '../../src/components/hud/StreakPanel';
import { forestMap } from '../../src/services/world/tiledMapLoader';
import { useSceneActivity } from '../../src/hooks/useSceneActivity';
import { useSceneQualityProfile } from '../../src/hooks/useSceneQualityProfile';
import { useSessionStore } from '../../src/stores/sessionStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function HomeScreen() {
  const sceneActive = useSceneActivity('HomeScreen');
  const qualityProfile = useSceneQualityProfile(sceneActive);
  const sessionStatus = useSessionStore((state) => state.status);
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [sessionPanelVisible, setSessionPanelVisible] = useState(false);
  const [settingsPanelVisible, setSettingsPanelVisible] = useState(false);
  const [streakPanelVisible, setStreakPanelVisible] = useState(false);
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
          ambientEffect="rain"
          zoomScale={zoomScale}
          zoomTranslateX={zoomTranslateX}
          zoomTranslateY={zoomTranslateY}
          active={sceneActive}
          qualityProfile={qualityProfile}
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

      {/* HUD overlay + Session panel */}
      {ready && !isZooming && (
        <HudOverlay
          onStartSession={() => setSessionPanelVisible(true)}
          onDecorate={handleDecorate}
          onEnterTent={handleTentTap}
          onOpenShop={handleOpenShop}
          onOpenSettings={() => setSettingsPanelVisible(true)}
          onOpenStreaks={() => setStreakPanelVisible(true)}
        />
      )}
      {ready && (
        <SessionPanel
          visible={sessionPanelVisible}
          onClose={() => setSessionPanelVisible(false)}
        />
      )}
      {ready && (
        <SettingsPanel
          visible={settingsPanelVisible}
          onClose={() => setSettingsPanelVisible(false)}
        />
      )}
      {ready && (
        <StreakPanel
          visible={streakPanelVisible}
          onClose={() => setStreakPanelVisible(false)}
        />
      )}
      {ready && sessionStatus === 'completed' && (
        <SessionCompletePopup onOpenShop={handleOpenShop} />
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
