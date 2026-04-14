import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StartSessionButton from './StartSessionButton';
import HudIconButton from './HudIconButton';
import SettingsButton from './SettingsButton';
import TimerButton from './TimerButton';
import LightBalanceDisplay from './LightBalanceDisplay';
import MuteToggleButton from './MuteToggleButton';
import EnterTentButton from './EnterTentButton';
import DecorateButton from './DecorateButton';
import StoreButton from './StoreButton';

interface HudOverlayProps {
  onStartSession: () => void;
  onDecorate?: () => void;
  onEnterTent?: () => void;
  onOpenShop?: () => void;
  onOpenSettings?: () => void;
}

export default function HudOverlay({ onStartSession, onDecorate, onEnterTent, onOpenShop, onOpenSettings }: HudOverlayProps) {
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      pointerEvents="box-none"
    >
      {/* Light balance — top left */}
      <Animated.View
        entering={FadeIn.delay(300).duration(400)}
        style={[styles.lightBalance, { top: insets.top + 8 }]}
      >
        <LightBalanceDisplay />
      </Animated.View>

      {/* Mute toggle — top right */}
      <Animated.View
        entering={FadeIn.delay(300).duration(400)}
        style={[styles.muteBtn, { top: insets.top + 8 }]}
      >
        <MuteToggleButton />
      </Animated.View>

      {/* Left column: Calendar (top) → Settings (bottom) */}
      <Animated.View
        entering={FadeIn.delay(600).duration(350)}
        style={[styles.iconBtn, { bottom: 118, left: 20 }]}
      >
        <TimerButton onPress={() => console.log('[HUD] calendar')} />
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(500).duration(350)}
        style={[styles.iconBtn, { bottom: 44, left: 20 }]}
      >
        <SettingsButton onPress={() => onOpenSettings?.()} />
      </Animated.View>

      {/* Center: Start Session CTA */}
      <Animated.View
        entering={FadeInUp.delay(400).duration(450)}
        style={styles.startBtn}
        pointerEvents="box-none"
      >
        <StartSessionButton onPress={onStartSession} />
      </Animated.View>

      {/* Right column: Enter Tent (top) → Decorate (mid) → Shop (bottom) */}
      <Animated.View
        entering={FadeIn.delay(700).duration(350)}
        style={[styles.iconBtn, { bottom: 192, right: 20 }]}
      >
        <EnterTentButton onPress={() => onEnterTent?.()} />
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(600).duration(350)}
        style={[styles.iconBtn, { bottom: 118, right: 20 }]}
      >
        <DecorateButton onPress={() => onDecorate?.()} />
      </Animated.View>

      <Animated.View
        entering={FadeIn.delay(500).duration(350)}
        style={[styles.iconBtn, { bottom: 44, right: 20 }]}
      >
        <StoreButton onPress={() => onOpenShop?.()} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  lightBalance: {
    position: 'absolute',
    left: 16,
  },
  muteBtn: {
    position: 'absolute',
    right: 16,
  },
  iconBtn: {
    position: 'absolute',
  },
  startBtn: {
    position: 'absolute',
    bottom: 76,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
