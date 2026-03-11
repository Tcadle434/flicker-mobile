import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import OnboardingButton from '../OnboardingButton';
import { useOnboardingStore } from '../../../stores/onboardingStore';

interface Props { onNext: () => void; }

function useAnimatedCounter(target: number, duration: number = 2000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [target, duration]);
  return value;
}

export default function Step6TheCost({ onNext }: Props) {
  const hours = useOnboardingStore((s) => s.preferences.screenTimeHours) || 4;
  const birthDate = useOnboardingStore((s) => s.preferences.birthDate);
  const hoursPerYear = hours * 365;
  const daysPerYear = Math.round(hoursPerYear / 24);

  // If birth date is available, calculate remaining life impact (avg life expectancy ~78)
  const age = birthDate
    ? Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;
  const remainingYears = birthDate ? Math.max(78 - age, 10) : 0;
  const screenYearsRemaining = birthDate
    ? Math.round((hoursPerYear * remainingYears) / 8760 * 10) / 10
    : 0;
  const yearsInDecade = Math.round((hoursPerYear * 10) / 8760 * 10) / 10;

  const animatedHours = useAnimatedCounter(hoursPerYear, 2000);
  const animatedDays = useAnimatedCounter(daysPerYear, 2500);

  return (
    <ContentScreen>
      <View style={styles.content}>
        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.title}>
          The Real Cost
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.statBlock}>
          <Text style={styles.bigNumber}>{animatedHours.toLocaleString()}</Text>
          <Text style={styles.statUnit}>hours per year</Text>
          <Text style={styles.statDetail}>on your phone screen</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(1000).duration(600)} style={styles.statBlock}>
          <Text style={styles.bigNumber}>{animatedDays}</Text>
          <Text style={styles.statUnit}>full days per year</Text>
          <Text style={styles.statDetail}>you'll never get back</Text>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(1400).duration(600)} style={styles.impactLine}>
          {birthDate
            ? `That's ${screenYearsRemaining} years of your remaining life.`
            : `That's ${yearsInDecade} years of your life this decade.`}
        </Animated.Text>
      </View>
      <Animated.View entering={FadeInDown.delay(1800).duration(400)}>
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
  title: {
    color: '#FAFAFA',
    fontSize: 32,
    fontWeight: '200',
    marginBottom: 40,
    textAlign: 'center',
  },
  statBlock: {
    alignItems: 'center',
    marginBottom: 32,
  },
  bigNumber: {
    color: '#F0A0A0',
    fontSize: 56,
    fontWeight: '200',
    letterSpacing: -2,
  },
  statUnit: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 18,
    fontWeight: '300',
    marginTop: 4,
  },
  statDetail: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
    fontWeight: '300',
    marginTop: 2,
  },
  impactLine: {
    color: '#F0A0A0',
    fontSize: 20,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 28,
    marginTop: 8,
    textShadowColor: 'rgba(240, 160, 160, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
