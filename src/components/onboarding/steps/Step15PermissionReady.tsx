import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import { ONBOARDING_ASSETS } from '../onboardingAssets';
import { playSound } from '../../../services/audio/uiSounds';

const { width: SCREEN_W } = Dimensions.get('window');
const FLICKER_SIZE = SCREEN_W * 0.42;

interface Props {
  onNext: () => void;
}

const BENEFITS = [
  { icon: '⛔', text: 'Start a session and your distracting apps shield automatically' },
  { icon: '↺', text: 'End early or finish normally and access comes right back' },
  { icon: '🔒', text: 'Your blocking settings stay private on this device' },
];

export default function Step15PermissionReady({ onNext }: Props) {
  return (
    <ContentScreen backgroundColor="#F5F0EA">
      <View style={styles.header}>
        <Animated.Text entering={FadeInDown.delay(100).duration(500)} style={styles.title}>
          You're ready.
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(240).duration(500)} style={styles.subtitle}>
          Flicker can now shield distracting apps the moment a session begins.
        </Animated.Text>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(220).duration(700)} style={styles.flickerWrap}>
          <Image
            source={ONBOARDING_ASSETS.flickerCalmBase}
            style={styles.flickerImage}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.benefits}>
          {BENEFITS.map((item, index) => (
            <Animated.View
              key={item.text}
              entering={FadeInDown.delay(420 + index * 120).duration(400)}
              style={styles.benefitRow}
            >
              <Text style={styles.benefitIcon}>{item.icon}</Text>
              <Text style={styles.benefitText}>{item.text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View entering={FadeInDown.delay(920).duration(400)}>
        <Pressable
          style={styles.ctaButton}
          onPress={() => {
            playSound('buttonPress');
            onNext();
          }}
        >
          <Text style={styles.ctaText}>See your plan</Text>
        </Pressable>
      </Animated.View>
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 68,
    paddingBottom: 6,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 23,
    textAlign: 'left',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flickerWrap: {
    marginBottom: 12,
  },
  flickerImage: {
    width: FLICKER_SIZE,
    height: FLICKER_SIZE,
  },
  benefits: {
    alignSelf: 'stretch',
    marginTop: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 10,
  },
  benefitIcon: {
    width: 28,
    fontSize: 20,
    textAlign: 'center',
  },
  benefitText: {
    flex: 1,
    marginLeft: 14,
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 21,
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
