import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import { ONBOARDING_ASSETS } from '../onboardingAssets';
import { playSound } from '../../../services/audio/uiSounds';

const { width: SCREEN_W } = Dimensions.get('window');
const FLICKER_SIZE = SCREEN_W * 0.42;

interface Props { onNext: () => void; }

const BENEFITS = [
  { icon: '\uD83D\uDEAB', text: 'Apps get shielded the moment a session starts' },
  { icon: '\u2705', text: 'Unblocked automatically when you finish or quit' },
  { icon: '\uD83D\uDD12', text: 'Your data never leaves your device' },
];

export default function Step14ScreenTimeExplain({ onNext }: Props) {
  return (
    <ContentScreen backgroundColor="#F5F0EA">
      <View style={styles.header}>
        <Animated.Text entering={FadeInDown.delay(100).duration(500)} style={styles.title}>
          Block Distracting Apps
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(250).duration(500)} style={styles.subtitle}>
          Flicker uses Screen Time to shield apps during sessions — so nothing pulls you away.
        </Animated.Text>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(200).duration(700)} style={styles.flickerWrap}>
          <Image
            source={ONBOARDING_ASSETS.flickerCalmBase}
            style={styles.flickerImage}
            resizeMode="contain"
          />
        </Animated.View>

        <View style={styles.benefits}>
          {BENEFITS.map((item, i) => (
            <Animated.View
              key={item.icon}
              entering={FadeInDown.delay(500 + i * 120).duration(400)}
              style={styles.benefitRow}
            >
              <Text style={styles.benefitIcon}>{item.icon}</Text>
              <Text style={styles.benefitText}>{item.text}</Text>
            </Animated.View>
          ))}
        </View>
      </View>

      <Animated.View entering={FadeInDown.delay(1000).duration(400)}>
        <Pressable
          style={styles.ctaButton}
          onPress={() => { playSound('buttonPress'); onNext(); }}
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
    paddingBottom: 4,
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
    marginBottom: 8,
  },
  flickerImage: {
    width: FLICKER_SIZE,
    height: FLICKER_SIZE,
  },
  benefits: {
    alignSelf: 'stretch',
    gap: 10,
    marginTop: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 14,
  },
  benefitIcon: {
    fontSize: 20,
  },
  benefitText: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: 15,
    fontWeight: '400',
    flex: 1,
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
