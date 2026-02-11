import { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { AtmosphericBackground } from '../../src/components/visuals/AtmosphericBackground';
import { SonaFace } from '../../src/components/visuals/SonaFace';
import { StreakDisplay } from '../../src/components/ui/StreakDisplay';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Toggle } from '../../src/components/ui/Toggle';
import { usePlayerStore } from '../../src/stores/playerStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useStreakStore } from '../../src/stores/streakStore';
import { useMoodStore } from '../../src/stores/moodStore';
import { useMoodTheme } from '../../src/hooks/useMoodTheme';
import { theme } from '../../src/constants/theme';

export default function Profile() {
  const router = useRouter();
  const moodTheme = useMoodTheme();
  const currentMood = useMoodStore((s) => s.currentMood);
  const { adaptiveEnabled, toggleAdaptive } = usePlayerStore();
  const { user, signOut } = useAuthStore();
  const { overallStreak, totalResets } = useStreakStore();

  const handleSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  }, [signOut, router]);

  return (
    <View style={styles.root}>
      <AtmosphericBackground mood={currentMood} />
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back button */}
          <Animated.View entering={FadeIn.delay(0).duration(400)}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Header — avatar + name */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(500).springify().damping(20)}
            style={styles.header}
          >
            <SonaFace size={96} mood={currentMood === 'overwhelmed' ? 'anxious' : currentMood} />
            <Text style={styles.title}>
              {user?.email?.split('@')[0] ?? 'You'}
            </Text>
            <Text style={styles.subtitle}>{user?.email ?? ''}</Text>
          </Animated.View>

          {/* Stats row */}
          <Animated.View
            entering={FadeIn.delay(300).duration(500)}
            style={styles.statsRow}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: moodTheme.primary }]}>
                {overallStreak}
              </Text>
              <Text style={styles.statLabel}>day streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: moodTheme.primary }]}>
                {totalResets}
              </Text>
              <Text style={styles.statLabel}>total sessions</Text>
            </View>
          </Animated.View>

          {/* Streak display */}
          <Animated.View
            entering={FadeIn.delay(400).duration(500)}
            style={styles.streakWrap}
          >
            <StreakDisplay />
          </Animated.View>

          {/* Settings */}
          <Animated.View entering={FadeIn.delay(500).duration(500)}>
            <GlassCard moodTint style={styles.card}>
              <Text style={[styles.sectionTitle, { color: moodTheme.primary }]}>
                Audio
              </Text>
              <Toggle
                value={adaptiveEnabled}
                onValueChange={() => toggleAdaptive()}
                label="Adaptive Mode"
                description="Adjusts the mix based on time, weather, and activity."
              />
            </GlassCard>
          </Animated.View>

          {/* Sign out */}
          <Animated.View entering={FadeIn.delay(700).duration(500)}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>

        </ScrollView>
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
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  backText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.light,
    color: theme.colors.text,
    letterSpacing: 1,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.light,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  streakWrap: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  signOutButton: {
    width: '100%',
    height: theme.layout.buttonHeight,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginTop: theme.spacing.lg,
  },
  signOutText: {
    color: '#EF4444',
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
