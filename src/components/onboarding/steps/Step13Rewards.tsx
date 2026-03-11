import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import OnboardingButton from '../OnboardingButton';
import { ONBOARDING_ASSETS } from '../onboardingAssets';

interface Props { onNext: () => void; }

const EARN_RATES = [
  { mode: 'Reset', rate: '3', color: '#7DD3FC' },
  { mode: 'Focus', rate: '2', color: '#5EEAD4' },
  { mode: 'Move', rate: '1', color: '#34D399' },
];

export default function Step13Rewards({ onNext }: Props) {
  return (
    <ContentScreen>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.headerRow}>
          <Image source={ONBOARDING_ASSETS.lightIcon} style={styles.lightIcon} />
          <Text style={styles.title}>Earn Light</Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.subtitle}>
          Complete sessions to earn Light, then spend it decorating Flicker's sanctuary.
        </Animated.Text>

        <View style={styles.ratesContainer}>
          {EARN_RATES.map((item, i) => (
            <Animated.View
              key={item.mode}
              entering={FadeInDown.delay(600 + i * 120).duration(400)}
              style={styles.rateRow}
            >
              <View style={[styles.rateColor, { backgroundColor: item.color }]} />
              <Text style={styles.rateMode}>{item.mode}</Text>
              <Text style={styles.rateValue}>{item.rate} Light / min</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(1000).duration(600)} style={styles.tentPreview}>
          <Image
            source={ONBOARDING_ASSETS.tentExterior}
            style={styles.tentImage}
            resizeMode="contain"
          />
          <Text style={styles.tentLabel}>Flicker's Sanctuary</Text>
          <Text style={styles.tentSubtext}>Fill it with furniture, decorations, and more</Text>
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(1400).duration(400)}>
        <OnboardingButton label="Continue" onPress={onNext} />
      </Animated.View>
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lightIcon: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  title: {
    color: '#FAFAFA',
    fontSize: 32,
    fontWeight: '200',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  ratesContainer: {
    gap: 10,
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rateColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  rateMode: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  rateValue: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '300',
  },
  tentPreview: {
    alignItems: 'center',
  },
  tentImage: {
    width: 160,
    height: 120,
    marginBottom: 12,
  },
  tentLabel: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '300',
    marginBottom: 4,
  },
  tentSubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '300',
  },
});
