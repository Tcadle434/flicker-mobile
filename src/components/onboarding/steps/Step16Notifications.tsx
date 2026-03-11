import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Notifications from 'expo-notifications';
import ContentScreen from '../ContentScreen';
import OnboardingButton from '../OnboardingButton';
import { useOnboardingStore } from '../../../stores/onboardingStore';

interface Props { onNext: () => void; }

export default function Step16Notifications({ onNext }: Props) {
  const setPermission = useOnboardingStore((s) => s.setPermission);

  const handleEnable = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermission('notifications', status === 'granted');
    } catch {
      setPermission('notifications', false);
    }
    onNext();
  }, [setPermission, onNext]);

  const handleSkip = useCallback(() => {
    setPermission('notifications', false);
    onNext();
  }, [setPermission, onNext]);

  return (
    <ContentScreen>
      <View style={styles.content}>
        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.emoji}>
          {'\uD83D\uDD14'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.title}>
          Gentle Reminders
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(600).duration(600)} style={styles.body}>
          We'll send you a nudge when it's time for your daily session. No spam — just friendly reminders to take care of yourself.
        </Animated.Text>
      </View>
      <View style={styles.buttons}>
        <Animated.View entering={FadeInDown.delay(800).duration(400)}>
          <OnboardingButton label="Enable" onPress={handleEnable} />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(900).duration(400)}>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Maybe later</Text>
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
