import { useEffect, useCallback, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { theme } from '../../src/constants/theme';
import { ParticleOrb } from '../../src/components/visuals/ParticleOrb';
import { AtmosphericBackground } from '../../src/components/visuals/AtmosphericBackground';
import { StreakDisplay } from '../../src/components/ui/StreakDisplay';
import { DurationSelector, Duration } from '../../src/components/ui/DurationSelector';
import { useMoodTheme } from '../../src/hooks/useMoodTheme';
import { useMoodStore } from '../../src/stores/moodStore';
import { useStreakStore } from '../../src/stores/streakStore';
import { usePlayerStore } from '../../src/stores/playerStore';
import { useSessionStore } from '../../src/stores/sessionStore';
import { MoodState } from '../../src/constants/moodThemes';

const moodAvatars: Record<MoodState, ReturnType<typeof require>> = {
  calm: require('../../assets/sona_calm_transparent.png'),
  neutral: require('../../assets/sona_neutral_transparent.png'),
  overwhelmed: require('../../assets/sona_overwhelmed_transparent.png'),
};

export default function Home() {
  const router = useRouter();
  const moodTheme = useMoodTheme();
  const currentMood = useMoodStore((s) => s.currentMood);
  const refreshMood = useMoodStore((s) => s.refreshMood);
  const fetchStreak = useStreakStore((s) => s.fetchStreak);
  const { initialize } = usePlayerStore();
  const setDuration = useSessionStore((s) => s.setDuration);

  const [duration, setLocalDuration] = useState<Duration>(3);
  const [isEntering, setIsEntering] = useState(false);

  const { width, height } = Dimensions.get('window');
  const orbSize = Math.min(width, height) * 0.58;

  // Reanimated values for orb entry transition
  const orbScale = useSharedValue(1);
  const uiOpacity = useSharedValue(1);

  useEffect(() => {
    initialize().catch(() => undefined);
    refreshMood();
    fetchStreak();
  }, []);

  const handleDurationChange = useCallback((d: Duration) => {
    setLocalDuration(d);
    setDuration(d);
  }, [setDuration]);

  const navigateToSession = useCallback(() => {
    router.push({
      pathname: '/reset',
      params: { duration: String(duration) },
    });
    // Reset animation values after navigation
    setTimeout(() => {
      orbScale.value = 1;
      uiOpacity.value = 1;
      setIsEntering(false);
    }, 600);
  }, [router, duration, orbScale, uiOpacity]);

  const startReset = useCallback(() => {
    if (isEntering) return;
    setIsEntering(true);

    // Orb scale up + UI fade out transition
    orbScale.value = withTiming(3, { duration: 600 });
    uiOpacity.value = withTiming(0, { duration: 400 }, () => {
      runOnJS(navigateToSession)();
    });
  }, [isEntering, orbScale, uiOpacity, navigateToSession]);

  const orbAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  const uiAnimStyle = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
  }));

  return (
    <View style={styles.root}>
      <AtmosphericBackground mood={currentMood} />
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        {/* Top bar */}
        <Animated.View style={[styles.topBar, uiAnimStyle]}>
          <StreakDisplay />
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(main)/profile')}
            activeOpacity={0.7}
          >
            <Image source={moodAvatars[currentMood]} style={styles.profileAvatar} resizeMode="contain" />
          </TouchableOpacity>
        </Animated.View>

        {/* Center orb */}
        <View style={styles.orbWrap}>
          <Animated.View style={orbAnimStyle}>
            <ParticleOrb
              mood={currentMood}
              size={orbSize}
              onTap={startReset}
            />
          </Animated.View>
        </View>

        {/* Bottom section */}
        <Animated.View style={[styles.bottomSection, uiAnimStyle]}>
          <DurationSelector value={duration} onChange={handleDurationChange} />
          <Text style={[styles.footerText, { color: `${moodTheme.primary}88` }]}>
            Let the noise fade.
          </Text>
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
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  profileButton: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatar: {
    width: 64,
    height: 64,
  },
  orbWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  footerText: {
    textAlign: 'center',
    fontSize: theme.typography.fontSize.sm,
    marginTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
});
