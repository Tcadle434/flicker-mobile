/**
 * DemoCompleteOverlay
 *
 * "Reset complete." overlay for the cinematic demo.
 * Matches the new SessionCompletePopup visual style:
 * PixelPanel popup, Toriko font for light earned, warm earth tones.
 * Parent controls all animations via shared values.
 */

import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import PixelPanel from '../../hud/PixelPanel';
import { HUD_ASSETS } from '../../hud/hudAssets';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(SCREEN_W - 48, 300);

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
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const popupStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const rewardStyle = useAnimatedStyle(() => ({
    opacity: rewardOpacity.value,
    transform: [{ scale: rewardScale.value }],
  }));

  const continueStyle = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  return (
    <Animated.View style={[styles.backdrop, backdropStyle]} pointerEvents="none">
      <Animated.View style={popupStyle}>
        <PixelPanel style={styles.panel} inset={10}>
          <View style={styles.content}>
            {/* Title */}
            <Animated.Text style={[styles.title, titleStyle]}>
              Reset complete.
            </Animated.Text>

            {/* Light earned */}
            <Animated.View style={[styles.lightRow, rewardStyle]}>
              <Image
                source={HUD_ASSETS.lightCrystal}
                style={styles.lightIcon}
                resizeMode="contain"
              />
              <Text style={styles.earnedText}>+9 light earned</Text>
            </Animated.View>
            <Animated.Text style={[styles.totalText, rewardStyle]}>
              total 42
            </Animated.Text>

            {/* Continue button */}
            <Animated.View style={[styles.continueWrap, continueStyle]}>
              <PixelPanel source={HUD_ASSETS.panelSlice2} scale={1} style={styles.continuePanel}>
                <View style={styles.continueInner}>
                  <Text style={styles.continueText}>Continue</Text>
                </View>
              </PixelPanel>
            </Animated.View>
          </View>
        </PixelPanel>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panel: {
    width: PANEL_W,
    height: 220,
  },
  content: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    color: '#3B2A1A',
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  lightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lightIcon: {
    width: 28,
    height: 28,
    marginTop: -2,
  },
  earnedText: {
    color: '#432925',
    fontFamily: 'Toriko',
    fontSize: 28,
    marginTop: 10,
  },
  totalText: {
    color: '#8B7A6A',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 16,
  },
  continueWrap: {
    width: PANEL_W - 60,
    height: 48,
  },
  continuePanel: {
    flex: 1,
  },
  continueInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(139, 100, 50, 0.18)',
  },
  continueText: {
    color: '#2E2014',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
