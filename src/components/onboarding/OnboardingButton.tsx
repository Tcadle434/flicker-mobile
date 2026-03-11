/**
 * OnboardingButton
 *
 * Spritesheet-based animated button using button_press_spritesheet.
 * Plays press animation then fires onPress. Same pattern as StartSessionButton.
 */

import React, { useCallback, useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  runOnJS,
} from 'react-native-reanimated';
import { ONBOARDING_ASSETS, BUTTON_META } from './onboardingAssets';

const { width: SCREEN_W } = Dimensions.get('window');
const DISPLAY_W = Math.min(SCREEN_W - 64, 360);
const DISPLAY_H = Math.round(DISPLAY_W * (BUTTON_META.frameHeight / BUTTON_META.frameWidth));
const SHEET_DISPLAY_W = DISPLAY_W * BUTTON_META.frameCount;

interface Props {
  label: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export default function OnboardingButton({ label, onPress, style, disabled }: Props) {
  const frameIndex = useSharedValue(0);
  const elapsed = useSharedValue(0);
  const playing = useSharedValue(false);
  const isPlaying = useRef(false);

  const onAnimationDone = useCallback(() => {
    isPlaying.current = false;
    onPress();
  }, [onPress]);

  useFrameCallback((info) => {
    if (!playing.value) return;
    if (info.timeSincePreviousFrame === null) return;

    elapsed.value += info.timeSincePreviousFrame;
    if (elapsed.value >= BUTTON_META.frameDuration) {
      elapsed.value -= BUTTON_META.frameDuration;
      const next = frameIndex.value + 1;
      if (next >= BUTTON_META.frameCount) {
        frameIndex.value = 0;
        playing.value = false;
        runOnJS(onAnimationDone)();
      } else {
        frameIndex.value = next;
      }
    }
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -(frameIndex.value * DISPLAY_W) }],
  }));

  const LABEL_OFFSET = [0, 2, 4, 4];
  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: LABEL_OFFSET[frameIndex.value] ?? 0 }],
  }));

  const handlePress = useCallback(() => {
    if (isPlaying.current || disabled) return;
    isPlaying.current = true;
    frameIndex.value = 0;
    elapsed.value = 0;
    playing.value = true;
  }, [frameIndex, elapsed, playing, disabled]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={[styles.container, style, disabled && styles.disabled]}
      disabled={disabled}
    >
      <View style={styles.clip}>
        <Animated.Image
          source={ONBOARDING_ASSETS.continueButton}
          style={[styles.sheet, animatedStyle]}
          resizeMode="stretch"
        />
      </View>
      <Animated.View style={[styles.labelOverlay, labelStyle]}>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: DISPLAY_W,
    height: DISPLAY_H,
    alignSelf: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
  clip: {
    width: DISPLAY_W,
    height: DISPLAY_H,
    overflow: 'hidden',
  },
  sheet: {
    width: SHEET_DISPLAY_W,
    height: DISPLAY_H,
  },
  labelOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#3B2A1A',
    fontFamily: 'Toriko',
    fontSize: 28,
    letterSpacing: 1,
    marginTop: -8,
    textShadowColor: 'rgba(255, 220, 160, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
});
