import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import OnboardingButton from '../OnboardingButton';
import { useOnboardingStore } from '../../../stores/onboardingStore';

interface Props { onNext: () => void; }

export default function Step18JourneyAhead({ onNext }: Props) {
  const hours = useOnboardingStore((s) => s.preferences.screenTimeHours) || 4;
  const savedPerWeek = Math.round(hours * 0.3 * 7); // Assume 30% reclaimed
  const savedPerYear = savedPerWeek * 52;

  return (
    <ContentScreen>
      <View style={styles.content}>
        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.title}>
          Your Journey Ahead
        </Animated.Text>

        <View style={styles.recapItems}>
          <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.recapItem}>
            <Text style={styles.recapEmoji}>{'\uD83E\uDDD8'}</Text>
            <View style={styles.recapTextContainer}>
              <Text style={styles.recapLabel}>Stress reduced</Text>
              <Text style={styles.recapDetail}>Daily reset sessions</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(550).duration(500)} style={styles.recapItem}>
            <Text style={styles.recapEmoji}>{'\uD83C\uDFAF'}</Text>
            <View style={styles.recapTextContainer}>
              <Text style={styles.recapLabel}>Focus sharpened</Text>
              <Text style={styles.recapDetail}>Distraction-free deep work</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).duration(500)} style={styles.recapItem}>
            <Text style={styles.recapEmoji}>{'\u23F0'}</Text>
            <View style={styles.recapTextContainer}>
              <Text style={styles.recapLabel}>~{savedPerYear} hours saved</Text>
              <Text style={styles.recapDetail}>Reclaimed from screen time per year</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(850).duration(500)} style={styles.recapItem}>
            <Text style={styles.recapEmoji}>{'\u2728'}</Text>
            <View style={styles.recapTextContainer}>
              <Text style={styles.recapLabel}>Clarity gained</Text>
              <Text style={styles.recapDetail}>A calmer, more intentional life</Text>
            </View>
          </Animated.View>
        </View>
      </View>
      <Animated.View entering={FadeInDown.delay(1100).duration(400)}>
        <OnboardingButton label="Continue" onPress={onNext} />
      </Animated.View>
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    color: '#FAFAFA',
    fontSize: 32,
    fontWeight: '200',
    textAlign: 'center',
    marginBottom: 36,
  },
  recapItems: {
    gap: 16,
  },
  recapItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  recapEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  recapTextContainer: {
    flex: 1,
  },
  recapLabel: {
    color: '#FAFAFA',
    fontSize: 17,
    fontWeight: '400',
    marginBottom: 2,
  },
  recapDetail: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '300',
  },
});
