import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import OnboardingButton from '../OnboardingButton';

interface Props { onNext: () => void; }

export default function Step14ScreenTimeExplain({ onNext }: Props) {
  return (
    <ContentScreen>
      <View style={styles.content}>
        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.emoji}>
          {'\uD83D\uDEE1\uFE0F'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(400).duration(600)} style={styles.title}>
          Screen Time Connection
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(600).duration(600)} style={styles.body}>
          During your sessions, Flicker can block distracting apps so you stay in the zone.
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(800).duration(600)} style={styles.body}>
          This requires Screen Time access. We never read your data — we only use it to block apps during active sessions.
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(1000).duration(600)} style={styles.privacyBadge}>
          <Text style={styles.privacyIcon}>{'\uD83D\uDD12'}</Text>
          <Text style={styles.privacyText}>Your data stays on your device</Text>
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(1200).duration(400)}>
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
  emoji: {
    fontSize: 56,
    marginBottom: 24,
  },
  title: {
    color: '#FAFAFA',
    fontSize: 28,
    fontWeight: '200',
    marginBottom: 20,
    textAlign: 'center',
  },
  body: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  privacyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  privacyText: {
    color: '#5EEAD4',
    fontSize: 14,
    fontWeight: '400',
  },
});
