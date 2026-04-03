import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import { ONBOARDING_ASSETS } from '../onboardingAssets';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { playSound } from '../../../services/audio/uiSounds';

const { width: SCREEN_W } = Dimensions.get('window');
const FLICKER_SIZE = SCREEN_W * 0.6;

interface Props { onNext: () => void; }

export default function StepFlickerCanHelp({ onNext }: Props) {
  const hours = useOnboardingStore((s) => s.preferences.screenTimeHours) || 4;
  const birthDate = useOnboardingStore((s) => s.preferences.birthDate);

  const age = birthDate
    ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 30;
  const remainingYears = Math.max(78 - age, 10);
  const screenYears = Math.round((hours * 365 * remainingYears) / 8760 * 10) / 10;
  const reclaimYears = Math.round(screenYears * 0.5 * 10) / 10;

  return (
    <ContentScreen backgroundColor="#F5F0EA">
      {/* Title */}
      <View style={styles.header}>
        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.title}>
          There's good news.
        </Animated.Text>
      </View>

      {/* Centered content */}
      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(300).duration(800)} style={styles.flickerWrap}>
          <Image
            source={ONBOARDING_ASSETS.flickerCalmBase}
            style={styles.flickerImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(700).duration(600)} style={styles.paceLabel}>
          I can help you get back
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.numberBlock}>
          <Text style={styles.bigNumber}>{reclaimYears} Years</Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(1200).duration(600)} style={styles.subline}>
          and help your mind reset daily.
        </Animated.Text>
      </View>

      {/* CTA */}
      <Animated.View entering={FadeInDown.delay(1800).duration(400)}>
        <Pressable
          style={styles.ctaButton}
          onPress={() => {
            playSound('buttonPress');
            onNext();
          }}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </Animated.View>
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 68,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flickerWrap: {
    marginBottom: -12,
    marginTop: -20,
  },
  flickerImage: {
    width: FLICKER_SIZE,
    height: FLICKER_SIZE,
  },
  paceLabel: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 22,
    fontWeight: '300',
    textAlign: 'center',
    marginBottom: 4,
  },
  numberBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  bigNumber: {
    color: '#27AE60',
    fontSize: 72,
    fontWeight: '700',
    letterSpacing: -3,
  },
  subline: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 22,
    fontWeight: '300',
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 16,
  },
  ctaText: {
    color: '#FAFAFA',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
});
