import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import OnboardingButton from '../OnboardingButton';

interface Props { onNext: () => void; }

const FEATURES = [
  'Deep work timer with focus soundscapes',
  'Blocks social media & distractions',
  'Tracks your productive hours',
  'Build an unbreakable focus habit',
];

export default function Step10FocusMode({ onNext }: Props) {
  return (
    <ContentScreen>
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.iconContainer}>
          <View style={[styles.modeIcon, { backgroundColor: 'rgba(94, 234, 212, 0.15)' }]}>
            <Text style={styles.iconEmoji}>{'\uD83C\uDFAF'}</Text>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={[styles.title, { color: '#5EEAD4' }]}>
          Focus Mode
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(500).duration(600)} style={styles.tagline}>
          Deep work sessions for peak productivity
        </Animated.Text>

        <View style={styles.features}>
          {FEATURES.map((feature, i) => (
            <Animated.View
              key={feature}
              entering={FadeInDown.delay(700 + i * 120).duration(400)}
              style={styles.featureRow}
            >
              <View style={[styles.dot, { backgroundColor: '#5EEAD4' }]} />
              <Text style={styles.featureText}>{feature}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
      <Animated.View entering={FadeInDown.delay(1300).duration(400)}>
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
  iconContainer: {
    marginBottom: 24,
  },
  modeIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 34,
    fontWeight: '200',
    marginBottom: 8,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '300',
    marginBottom: 36,
    textAlign: 'center',
  },
  features: {
    gap: 14,
    alignSelf: 'stretch',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 14,
  },
  featureText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '300',
  },
});
