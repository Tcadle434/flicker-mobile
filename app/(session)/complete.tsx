import { useEffect, useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  RadialGradient,
  vec,
} from '@shopify/react-native-skia';
import { AtmosphericBackground } from '../../src/components/visuals/AtmosphericBackground';
import { SonaFace } from '../../src/components/visuals/SonaFace';
import { StreakDisplay } from '../../src/components/ui/StreakDisplay';
import { MoodCheckIn } from '../../src/components/ui/MoodCheckIn';
import { theme } from '../../src/constants/theme';
import { setLastResetAt } from '../../src/services/storage/resetStorage';
import { useStreakStore } from '../../src/stores/streakStore';
import { useMoodStore } from '../../src/stores/moodStore';
import { useSessionStore } from '../../src/stores/sessionStore';

const CALM_PRIMARY = '#7DD3FC';
const GLOW_SIZE = 200;

const MESSAGES = [
  'Carry this with you.',
  'Let the noise stay quiet.',
  'Congratulate yourself for taking this time.',
  'Soft focus, steady breath.',
  'Keep this calm close.',
  'You made space for yourself.',
  'Return to this whenever you need.',
];

function getDailyMessage() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const day = Math.floor(diff / 86400000);
  return MESSAGES[day % MESSAGES.length];
}

export default function ResetComplete() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const message = useMemo(getDailyMessage, []);
  const recordReset = useStreakStore((s) => s.recordReset);
  const refreshMood = useMoodStore((s) => s.refreshMood);
  const durationMinutes = useSessionStore((s) => s.durationMinutes);
  const [moodRecorded, setMoodRecorded] = useState(false);

  useEffect(() => {
    setLastResetAt(Date.now());
    refreshMood();
  }, []);

  const handleMoodSelect = useCallback(async (mood: string | null) => {
    if (moodRecorded) return;
    setMoodRecorded(true);
    await recordReset(durationMinutes, mood ?? undefined);
  }, [durationMinutes, recordReset, moodRecorded]);

  const handleDone = useCallback(() => {
    if (!moodRecorded) {
      recordReset(durationMinutes);
    }
    router.replace('/(main)/home');
  }, [router, moodRecorded, durationMinutes, recordReset]);

  return (
    <View style={styles.root}>
      <AtmosphericBackground mood="calm" />
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        {/* Streak display — top left */}
        <Animated.View
          entering={FadeIn.delay(300).duration(500)}
          style={styles.streakWrap}
        >
          <StreakDisplay />
        </Animated.View>

        {/* Main content — centered with slight upward bias */}
        <View style={styles.content}>
          {/* SonaFace with glow */}
          <Animated.View
            entering={FadeIn.delay(0).duration(600)}
            style={styles.faceWrap}
          >
            <Canvas style={styles.glowCanvas}>
              <Circle
                cx={GLOW_SIZE / 2}
                cy={GLOW_SIZE / 2}
                r={GLOW_SIZE / 2}
              >
                <RadialGradient
                  c={vec(GLOW_SIZE / 2, GLOW_SIZE / 2)}
                  r={GLOW_SIZE / 2}
                  colors={['rgba(125, 211, 252, 0.25)', 'rgba(125, 211, 252, 0)']}
                />
              </Circle>
            </Canvas>
            <SonaFace size={140} mood="calm" />
          </Animated.View>

          {/* Title */}
          <Animated.Text
            entering={FadeInUp.delay(400).duration(500).springify().damping(20)}
            style={styles.title}
          >
            Reset complete.
          </Animated.Text>

          {/* Daily message */}
          <Animated.Text
            entering={FadeIn.delay(700).duration(500)}
            style={styles.message}
          >
            {message}
          </Animated.Text>

          {/* Mood check-in */}
          <Animated.View
            entering={FadeIn.delay(1000).duration(500)}
          >
            <MoodCheckIn onSelect={handleMoodSelect} />
          </Animated.View>
        </View>

        {/* Done button — bottom */}
        <Animated.View
          entering={FadeIn.delay(1200).duration(500)}
          style={styles.buttonWrap}
        >
          <TouchableOpacity
            style={[styles.doneButton, { maxWidth: width - theme.spacing.lg * 2 }]}
            onPress={handleDone}
            activeOpacity={0.7}
          >
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  streakWrap: {
    marginTop: theme.spacing.sm,
    alignSelf: 'flex-start',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.spacing.xxxl, // slight upward bias
  },
  faceWrap: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  glowCanvas: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.light,
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  buttonWrap: {
    paddingBottom: theme.spacing.lg,
    width: '100%',
  },
  doneButton: {
    width: '100%',
    height: theme.layout.buttonHeight,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: CALM_PRIMARY,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneText: {
    color: CALM_PRIMARY,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
