import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import OnboardingButton from '../OnboardingButton';
import { useOnboardingStore } from '../../../stores/onboardingStore';

interface Props { onNext: () => void; }

export default function Step17Tracking({ onNext }: Props) {
  const setPermission = useOnboardingStore((s) => s.setPermission);

  const handleAllow = useCallback(async () => {
    // TODO: Add expo-tracking-transparency when ready for production ATT prompt
    // For now, just mark as granted and continue
    setPermission('tracking', true);
    onNext();
  }, [setPermission, onNext]);

  const handleSkip = useCallback(() => {
    setPermission('tracking', false);
    onNext();
  }, [setPermission, onNext]);

  return (
    <ContentScreen>
      <View style={styles.content}>
        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.emoji}>
          {'\uD83D\uDCCA'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.title}>
          Help Us Improve
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(600).duration(600)} style={styles.body}>
          Allow anonymous usage data so we can make Flicker better for everyone. You can always change this in Settings.
        </Animated.Text>
      </View>
      <View style={styles.buttons}>
        <Animated.View entering={FadeInDown.delay(800).duration(400)}>
          <OnboardingButton label="Allow" onPress={handleAllow} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(900).duration(400)}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>No thanks</Text>
          </Pressable>
        </Animated.View>
      </View>
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
    fontSize: 56,
    marginBottom: 24,
  },
  title: {
    color: '#FAFAFA',
    fontSize: 28,
    fontWeight: '200',
    marginBottom: 16,
    textAlign: 'center',
  },
  body: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 24,
    textAlign: 'center',
  },
  buttons: {
    gap: 12,
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 16,
    fontWeight: '300',
  },
});
