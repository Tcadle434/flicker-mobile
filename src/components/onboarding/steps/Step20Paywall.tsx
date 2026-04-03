import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import ContentScreen from '../ContentScreen';
import OnboardingButton from '../OnboardingButton';
import { useOnboardingStore } from '../../../stores/onboardingStore';

interface Props { onNext: () => void; }

export default function Step20Paywall({ onNext }: Props) {
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const handleStart = useCallback(async () => {
    // TODO: Replace with Superwall paywall presentation
    // For now, complete onboarding and navigate to home
    await completeOnboarding();
    router.replace('/(main)/home');
  }, [completeOnboarding]);

  return (
    <ContentScreen>
      <View style={styles.content}>
        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.emoji}>
          {'\uD83D\uDD25'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.title}>
          Start Your Free Trial
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(600).duration(600)} style={styles.subtitle}>
          7 days free, then $9.99/month
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(800).duration(600)} style={styles.body}>
          Cancel anytime. No commitment.{'\n'}Your journey starts now.
        </Animated.Text>
      </View>
      <Animated.View entering={FadeInDown.delay(1000).duration(400)}>
        <OnboardingButton label="Let's Go!" onPress={handleStart} />
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
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    color: '#FAFAFA',
    fontSize: 32,
    fontWeight: '200',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 18,
    fontWeight: '300',
    marginBottom: 20,
    textAlign: 'center',
  },
  body: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 24,
    textAlign: 'center',
  },
});
