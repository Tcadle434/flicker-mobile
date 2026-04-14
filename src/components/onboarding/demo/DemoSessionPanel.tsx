/**
 * DemoSessionPanel
 *
 * Visual clone of SessionPanel for the cinematic demo.
 * Uses the new PixelPanel-based UI with warm earth tones.
 * Purely driven by shared values from the parent orchestrator — no internal state.
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import PixelPanel from '../../hud/PixelPanel';
import { HUD_ASSETS } from '../../hud/hudAssets';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const PANEL_TOP = SCREEN_H * 0.38;
const PANEL_H = SCREEN_H - PANEL_TOP;

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

  const relaxInnerStyle = useAnimatedStyle(() => ({
    backgroundColor: relaxHighlight.value > 0.5 ? 'rgba(139,100,50,0.18)' : 'transparent',
  }));

  const relaxTextStyle = useAnimatedStyle(() => ({
    color: relaxHighlight.value > 0.5 ? '#2E2014' : '#5C4A3A',
  }));

  const durRowStyle = useAnimatedStyle(() => ({
    opacity: durationsOpacity.value,
  }));

  const beginContainerStyle = useAnimatedStyle(() => ({
    opacity: beginOpacity.value,
    transform: [{ scale: beginScale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, containerStyle]} pointerEvents="none">
      <PixelPanel style={styles.panel} inset={10}>
        <View style={styles.content}>
          <Text style={styles.title}>Start Session</Text>
          <Text style={styles.subtitle}>
            Choose your mode, dial in the duration, then begin.
          </Text>

          <Text style={styles.sectionLabel}>Mode</Text>
          <View style={styles.modeRow}>
            {/* Relax — highlights when relaxHighlight fires */}
            <PixelPanel source={HUD_ASSETS.panelSlice2} scale={1} style={styles.modeCard}>
              <Animated.View style={[styles.modeInner, relaxInnerStyle]}>
                <Animated.Text style={[styles.modeText, relaxTextStyle]}>Relax</Animated.Text>
              </Animated.View>
            </PixelPanel>
            {/* Focus — static */}
            <PixelPanel source={HUD_ASSETS.panelSlice2} scale={1} style={styles.modeCard}>
              <View style={styles.modeInner}>
                <Text style={styles.modeText}>Focus</Text>
              </View>
            </PixelPanel>
          </View>

          <Animated.View style={durRowStyle}>
            <Text style={styles.sectionLabel}>Duration</Text>
            <View style={styles.durationDisplay}>
              <Text style={styles.durationValue}>10</Text>
              <Text style={styles.durationUnit}>min</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.beginWrap, beginContainerStyle]}>
            <PixelPanel source={HUD_ASSETS.panelSlice2} scale={1} style={styles.beginPanel}>
              <View style={styles.beginInner}>
                <Text style={styles.beginText}>Begin</Text>
              </View>
            </PixelPanel>
          </Animated.View>
        </View>
      </PixelPanel>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PANEL_TOP,
    height: PANEL_H,
  },
  panel: {
    width: SCREEN_W,
    height: PANEL_H,
  },
  content: {
    flex: 1,
  },
  title: {
    color: '#3B2A1A',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 4,
  },
  subtitle: {
    color: '#6E5A48',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 18,
  },
  sectionLabel: {
    color: '#8B7A6A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  modeCard: {
    flex: 1,
    height: 58,
  },
  modeInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    color: '#5C4A3A',
    fontSize: 15,
    fontWeight: '700',
  },
  durationDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 24,
  },
  durationValue: {
    color: '#3B2A1A',
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: -1,
  },
  durationUnit: {
    color: '#8B7A6A',
    fontSize: 16,
    fontWeight: '500',
  },
  beginWrap: {
    marginTop: 'auto' as any,
    alignSelf: 'center',
    width: SCREEN_W * 0.55,
    height: 64,
  },
  beginPanel: {
    flex: 1,
  },
  beginInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 100, 50, 0.18)',
  },
  beginText: {
    color: '#2E2014',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
