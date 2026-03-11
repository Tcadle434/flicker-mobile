/**
 * ProgressIndicator
 *
 * Subtle animated progress bar at the top of the onboarding flow.
 * Thin glowing line that fills as user progresses through steps.
 */

import React, { useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface Props {
  currentStep: number;
  totalSteps: number;
}

export default function ProgressIndicator({ currentStep, totalSteps }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const progress = (currentStep + 1) / totalSteps;

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const barStyle = useAnimatedStyle(() => ({
    width: withTiming(trackWidth * progress, { duration: 400 }),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.track} onLayout={onLayout}>
        <Animated.View style={[styles.fill, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
  },
  track: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 1.5,
    backgroundColor: '#7DD3FC',
    shadowColor: '#7DD3FC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
});
