/**
 * DemoCompleteOverlay
 *
 * "Reset complete." overlay for the cinematic demo.
 * Visual clone of complete.tsx with hardcoded values (+9 light, total 42).
 * Parent controls opacity via shared value.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated';

const CALM_PRIMARY = '#7DD3FC';

interface Props {
  overlayOpacity: SharedValue<number>;
  titleOpacity: SharedValue<number>;
  titleTranslateY: SharedValue<number>;
  messageOpacity: SharedValue<number>;
  rewardOpacity: SharedValue<number>;
  rewardScale: SharedValue<number>;
}

export default function DemoCompleteOverlay({
  overlayOpacity,
  titleOpacity,
  titleTranslateY,
  messageOpacity,
  rewardOpacity,
  rewardScale,
}: Props) {
  const containerStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const messageStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  const rewardStyle = useAnimatedStyle(() => ({
    opacity: rewardOpacity.value,
    transform: [{ scale: rewardScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <View style={styles.content}>
        <Animated.Text style={[styles.title, titleStyle]}>
          Reset complete.
        </Animated.Text>

        <Animated.Text style={[styles.message, messageStyle]}>
          Carry this with you.
        </Animated.Text>

        <Animated.View style={[styles.rewardPill, rewardStyle]}>
          <Text style={styles.rewardText}>+9 light</Text>
          <Text style={styles.rewardSubtext}>total 42</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 64,
  },
  title: {
    color: '#FAFAFA',
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    color: '#A1A1AA',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  rewardPill: {
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(125,211,252,0.4)',
    backgroundColor: 'rgba(125,211,252,0.12)',
    alignItems: 'center',
  },
  rewardText: {
    color: CALM_PRIMARY,
    fontSize: 18,
    fontWeight: '600',
  },
  rewardSubtext: {
    color: '#A1A1AA',
    fontSize: 12,
    marginTop: 2,
  },
});
