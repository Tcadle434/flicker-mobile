/**
 * DemoSessionPanel
 *
 * Visual clone of SessionPanel for the cinematic demo.
 * Purely driven by shared values from the parent orchestrator — no internal timers.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated';

const MODE_COLORS = {
  reset: '#7DD3FC',
  focus: '#5EEAD4',
  move: '#34D399',
};

const DURATIONS = [5, 10, 15, 20];

interface Props {
  panelOpacity: SharedValue<number>;
  panelTranslateY: SharedValue<number>;
  relaxHighlight: SharedValue<number>;
  durationsOpacity: SharedValue<number>;
  dur10Highlight: SharedValue<number>;
  beginOpacity: SharedValue<number>;
  beginScale: SharedValue<number>;
}

export default function DemoSessionPanel({
  panelOpacity,
  panelTranslateY,
  relaxHighlight,
  durationsOpacity,
  dur10Highlight,
  beginOpacity,
  beginScale,
}: Props) {
  const containerStyle = useAnimatedStyle(() => ({
    opacity: panelOpacity.value,
    transform: [{ translateY: panelTranslateY.value }],
  }));

  const relaxStyle = useAnimatedStyle(() => ({
    borderColor: relaxHighlight.value > 0.5 ? MODE_COLORS.reset : 'rgba(255,255,255,0.08)',
    backgroundColor: relaxHighlight.value > 0.5 ? 'rgba(125,211,252,0.06)' : 'rgba(255,255,255,0.06)',
  }));

  const relaxLabelStyle = useAnimatedStyle(() => ({
    color: relaxHighlight.value > 0.5 ? MODE_COLORS.reset : 'rgba(255,255,255,0.5)',
  }));

  const durRowStyle = useAnimatedStyle(() => ({
    opacity: durationsOpacity.value,
  }));

  const dur10Style = useAnimatedStyle(() => ({
    backgroundColor: dur10Highlight.value > 0.5 ? MODE_COLORS.reset : 'rgba(255,255,255,0.06)',
  }));

  const dur10TextStyle = useAnimatedStyle(() => ({
    color: dur10Highlight.value > 0.5 ? '#0A0A0B' : 'rgba(255,255,255,0.6)',
    fontWeight: dur10Highlight.value > 0.5 ? '700' : '500',
  }));

  const beginContainerStyle = useAnimatedStyle(() => ({
    opacity: beginOpacity.value,
    transform: [{ scale: beginScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <View style={styles.panel}>
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <Text style={styles.title}>Start Session</Text>

        {/* Mode cards */}
        <View style={styles.modeRow}>
          <Animated.View style={[styles.modeCard, relaxStyle]}>
            <Animated.Text style={[styles.modeLabel, relaxLabelStyle]}>Relax</Animated.Text>
          </Animated.View>
          <View style={styles.modeCard}>
            <Text style={styles.modeLabel}>Focus</Text>
          </View>
          <View style={styles.modeCard}>
            <Text style={styles.modeLabel}>Exercise</Text>
          </View>
        </View>

        {/* Duration chips */}
        <Animated.View style={[styles.durationRow, durRowStyle]}>
          {DURATIONS.map((d) => {
            const is10 = d === 10;
            return (
              <Animated.View
                key={d}
                style={[styles.durationChip, is10 ? dur10Style : undefined]}
              >
                <Animated.Text
                  style={[styles.durationText, is10 ? dur10TextStyle : undefined]}
                >
                  {d} min
                </Animated.Text>
              </Animated.View>
            );
          })}
        </Animated.View>

        {/* Begin button */}
        <Animated.View style={[styles.beginRow, beginContainerStyle]}>
          <View style={styles.beginButton}>
            <Text style={styles.beginText}>Begin</Text>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#141416',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 24,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  modeCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  modeLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  durationText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  beginRow: {
    alignItems: 'center',
  },
  beginButton: {
    width: 160,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#7DD3FC',
    backgroundColor: 'rgba(125,211,252,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginText: {
    color: '#7DD3FC',
    fontSize: 16,
    fontWeight: '600',
  },
});
