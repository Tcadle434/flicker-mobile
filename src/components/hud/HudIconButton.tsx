/**
 * HUD Icon Button
 *
 * Spritesheet-based animated button for the 4 main HUD actions.
 * Shows first frame at rest, plays press animation on tap.
 *
 * Spritesheet: 4 frames, each 96×32 px. The button is the center
 * 32×32 region (32px padding on each side per frame).
 * Uses useFrameCallback for discrete frame stepping.
 */

import React, { useCallback, useRef } from 'react';
import { View, Image, StyleSheet, type ImageSourcePropType, type ViewStyle } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useFrameCallback,
  runOnJS,
} from 'react-native-reanimated';
import { playSound } from '../../services/audio/uiSounds';

const SPRITESHEET = require('../../../assets/ui/button_press_spritesheet.png');

// Sprite frame dimensions
const FRAME_W = 96;
const FRAME_H = 32;
const FRAME_COUNT = 4;
const BUTTON_REGION = 32; // center square of each frame
const PADDING = (FRAME_W - BUTTON_REGION) / 2; // 32px

// Display size — the visible button
const DISPLAY_SIZE = 54;
// Scale factor from sprite pixels to display points
const SCALE = DISPLAY_SIZE / BUTTON_REGION;
// Full frame display dimensions (scaled)
const FRAME_DISPLAY_W = FRAME_W * SCALE;
const FRAME_DISPLAY_H = FRAME_H * SCALE;
// Offset to hide the 32px padding on each side
const PAD_DISPLAY = PADDING * SCALE;
// Full sheet width scaled
const SHEET_DISPLAY_W = FRAME_DISPLAY_W * FRAME_COUNT;

const FRAME_DURATION = 70; // ms per frame

// Icon overlay shift per frame (follows button face depression)
const ICON_OFFSET_Y = [0, 2, 6, 6];

type HudIcon = 'settings' | 'shop' | 'decorate' | 'calendar';

const ICON_SOURCES: Partial<Record<HudIcon, ImageSourcePropType>> = {
  decorate: require('../../../assets/ui/btn_icon_paintbrush_01.png'),
};

interface Props {
  icon: HudIcon;
  onPress: () => void;
  style?: ViewStyle;
}

export default function HudIconButton({ icon, onPress, style }: Props) {
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
    if (elapsed.value >= FRAME_DURATION) {
      elapsed.value -= FRAME_DURATION;
      const next = frameIndex.value + 1;
      if (next >= FRAME_COUNT) {
        frameIndex.value = 0;
        playing.value = false;
        runOnJS(onAnimationDone)();
      } else {
        frameIndex.value = next;
      }
    }
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -(frameIndex.value * FRAME_DISPLAY_W) - PAD_DISPLAY }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ICON_OFFSET_Y[frameIndex.value] ?? 0 }],
  }));

  const iconSource = ICON_SOURCES[icon];

  const handlePress = useCallback(() => {
    if (isPlaying.current) return;
    isPlaying.current = true;
    playSound('buttonPress');
    if (icon === 'shop') playSound('shopOpen');
    frameIndex.value = 0;
    elapsed.value = 0;
    playing.value = true;
  }, [frameIndex, elapsed, playing, icon]);

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(handlePress)();
  });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.container, style]}>
        <View style={styles.clip}>
          <Animated.Image
            source={SPRITESHEET}
            style={[styles.sheet, animatedStyle]}
            resizeMode="stretch"
          />
        </View>
        {iconSource && (
          <Animated.View style={[styles.iconOverlay, iconStyle]}>
            <Image source={iconSource} style={styles.icon} resizeMode="contain" />
          </Animated.View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
  },
  clip: {
    width: DISPLAY_SIZE,
    height: DISPLAY_SIZE,
    overflow: 'hidden',
  },
  sheet: {
    width: SHEET_DISPLAY_W,
    height: FRAME_DISPLAY_H,
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  icon: {
    width: 32,
    height: 32,
  },
});
