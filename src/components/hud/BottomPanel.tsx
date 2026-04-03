/**
 * Bottom Panel — reusable slide-up panel shell.
 *
 * Dark backdrop + pan-to-dismiss + PixelPanel frame + scrollable content.
 * Used by SettingsPanel, and later by the timer/notifications panel.
 */

import React, { useEffect } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PixelPanel from './PixelPanel';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const DISMISS_THRESHOLD = 100;

interface BottomPanelProps {
  visible: boolean;
  onClose: () => void;
  /** Fraction of screen height where the panel top sits (0.15 = 15% from top). */
  panelTopFraction?: number;
  children: React.ReactNode;
}

export default function BottomPanel({
  visible,
  onClose,
  panelTopFraction = 0.15,
  children,
}: BottomPanelProps) {
  const insets = useSafeAreaInsets();
  const panelTop = SCREEN_H * panelTopFraction;
  const panelHeight = SCREEN_H - panelTop;

  const translateY = useSharedValue(SCREEN_H);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(panelTop, { duration: 300 });
      backdropOpacity.value = withTiming(0.6, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_H, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [backdropOpacity, panelTop, translateY, visible]);

  const dismiss = () => {
    onClose();
  };

  const pan = Gesture.Pan()
    .activeOffsetY(20)
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = panelTop + event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(SCREEN_H, { duration: 250 });
        backdropOpacity.value = withTiming(0, { duration: 250 });
        runOnJS(dismiss)();
      } else {
        translateY.value = withTiming(panelTop, { duration: 300 });
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.panelWrapper, panelStyle]}>
          <PixelPanel style={[styles.panel, { width: SCREEN_W, height: panelHeight }]} inset={10}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[
                styles.scrollContent,
                { paddingBottom: insets.bottom + 24 },
              ]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {children}
            </ScrollView>
          </PixelPanel>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  panelWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_H,
  },
  panel: {},
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
});
