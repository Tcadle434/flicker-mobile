/**
 * Tent View HUD
 *
 * Shown when inside the tent in view mode (not decorating).
 * - Back arrow (top-left) → return to overworld
 * - Light balance (top-left, below back)
 * - Decorate button (bottom-right)
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LightBalanceDisplay from './LightBalanceDisplay';
import HudIconButton from './HudIconButton';
import StoreButton from './StoreButton';
import MuteToggleButton from './MuteToggleButton';
import { HUD_ASSETS } from './hudAssets';

interface Props {
  onBack: () => void;
  onDecorate: () => void;
  onOpenShop: () => void;
}

export default function TentViewHud({ onBack, onDecorate, onOpenShop }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      pointerEvents="box-none"
      entering={FadeIn.duration(300)}
    >
      {/* Back arrow — top left */}
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        style={[styles.backBtn, { top: insets.top + 8 }]}
      >
        <Image
          source={HUD_ASSETS.backArrow}
          style={styles.backIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Mute toggle — top right */}
      <Animated.View style={[styles.muteBtn, { top: insets.top + 8 }]}>
        <MuteToggleButton />
      </Animated.View>

      {/* Light balance — centered in top row */}
      <Animated.View style={[styles.lightBalance, { top: insets.top + 8 }]} pointerEvents="box-none">
        <LightBalanceDisplay />
      </Animated.View>

      {/* Shop button — bottom right, above decorate */}
      <Animated.View style={[styles.bottomBtn, { bottom: 112 }]}>
        <StoreButton onPress={onOpenShop} />
      </Animated.View>

      {/* Decorate button — bottom right */}
      <Animated.View style={[styles.bottomBtn, { bottom: 52 }]}>
        <HudIconButton icon="decorate" onPress={onDecorate} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 32,
    height: 32,
  },
  lightBalance: {
    position: 'absolute',
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  muteBtn: {
    position: 'absolute',
    right: 16,
  },
  bottomBtn: {
    position: 'absolute',
    right: 20,
  },
});
