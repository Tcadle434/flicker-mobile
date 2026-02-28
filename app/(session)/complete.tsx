import { useEffect, useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { theme } from '../../src/constants/theme';
import { useStreakStore } from '../../src/stores/streakStore';
import { useMoodStore } from '../../src/stores/moodStore';
import { useSessionStore } from '../../src/stores/sessionStore';
import { useCurrencyStore } from '../../src/stores/currencyStore';
import { cancelStreakReminder } from '../../src/services/notifications/notificationService';
import { logSession } from '../../src/services/api/sessionLogService';

const CALM_PRIMARY = '#7DD3FC';
const MOVE_ACCENT = '#34D399';
const GLOW_SIZE = 200;

const ACTIVITY_TAGS = ['Walk', 'Run', 'Gym', 'Yoga', 'Stretch'] as const;

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
  const params = useLocalSearchParams<{
    sessionId?: string;
    duration?: string;
    mode?: 'reset' | 'focus' | 'move';
  }>();
  const { width } = useWindowDimensions();
  const message = useMemo(getDailyMessage, []);
  const fetchStreak = useStreakStore((s) => s.fetchStreak);
  const refreshMood = useMoodStore((s) => s.refreshMood);
  const durationMinutesFromStore = useSessionStore((s) => s.durationMinutes);
  const modeFromStore = useSessionStore((s) => s.mode);
  const sessionIdFromStore = useSessionStore((s) => s.sessionId);
  const sessionStatus = useSessionStore((s) => s.status);
  const targetSeconds = useSessionStore((s) => s.targetSeconds);
  const elapsedSeconds = useSessionStore((s) => s.elapsed);
  const resetSession = useSessionStore((s) => s.resetSession);
  const awardSessionCompletion = useCurrencyStore((s) => s.awardSessionCompletion);
  const lightBalance = useCurrencyStore((s) => s.balance);
  const [earnedLight, setEarnedLight] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const sessionId = useMemo(() => {
    if (typeof params.sessionId === 'string' && params.sessionId.length > 0) return params.sessionId;
    return sessionIdFromStore;
  }, [params.sessionId, sessionIdFromStore]);

  const durationMinutes = useMemo(() => {
    if (typeof params.duration === 'string') {
      const parsed = Number(params.duration);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
    return durationMinutesFromStore;
  }, [params.duration, durationMinutesFromStore]);

  const sessionMode = useMemo<'reset' | 'focus' | 'move'>(() => {
    if (params.mode === 'reset' || params.mode === 'focus' || params.mode === 'move') {
      return params.mode;
    }
    return modeFromStore;
  }, [params.mode, modeFromStore]);

  const completionTitle = useMemo(() => {
    if (sessionMode === 'focus') return 'Focus complete.';
    if (sessionMode === 'move') return 'Move complete.';
    return 'Reset complete.';
  }, [sessionMode]);

  // Log session, award currency, refresh mood + streak on mount.
  // logSession writes the session_logs row first so subsequent reads see it.
  useEffect(() => {
    if (!sessionId || sessionStatus !== 'completed') {
      setEarnedLight(0);
      return;
    }

    let cancelled = false;
    (async () => {
      // Award currency
      const result = await awardSessionCompletion({
        sessionId,
        mode: sessionMode,
        durationMinutes,
      });
      if (cancelled) return;
      setEarnedLight(result.amount);

      // Write session to Supabase (single source of truth)
      await logSession({
        sessionId,
        mode: sessionMode,
        targetSeconds,
        elapsedSeconds,
        status: 'completed',
        lightEarned: result.amount,
      });

      if (cancelled) return;

      // Refresh mood (reads last reset from session_logs) and streak
      await refreshMood();
      fetchStreak();
    })();

    cancelStreakReminder();
    return () => { cancelled = true; };
  }, []);

  const handleMoodSelect = useCallback((_mood: string | null) => {
    // Mood is derived from timestamp, not user selection — no-op
  }, []);

  const handleDone = useCallback(() => {
    // Persist activity tag for Move sessions (best-effort update to session log)
    if (sessionMode === 'move' && selectedTag && sessionId) {
      logSession({
        sessionId,
        mode: sessionMode,
        targetSeconds,
        elapsedSeconds,
        status: 'completed',
        lightEarned: earnedLight,
        activityTag: selectedTag,
      });
    }
    resetSession();
    router.replace('/(main)/home');
  }, [router, resetSession, sessionMode, selectedTag, sessionId, targetSeconds, elapsedSeconds, earnedLight]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.safeArea}>
        {/* Main content — centered with slight upward bias */}
        <View style={styles.content}>
          {/* Title */}
          <Animated.Text
            entering={FadeInUp.delay(400).duration(500).springify().damping(20)}
            style={styles.title}
          >
            {completionTitle}
          </Animated.Text>

          {/* Daily message */}
          <Animated.Text
            entering={FadeIn.delay(700).duration(500)}
            style={styles.message}
          >
            {message}
          </Animated.Text>

          <Animated.View entering={FadeIn.delay(850).duration(500)} style={styles.rewardPill}>
            <Text style={styles.rewardText}>+{earnedLight} light</Text>
            <Text style={styles.rewardSubtext}>total {lightBalance}</Text>
          </Animated.View>

          {/* Activity tags (Move mode) */}
          {sessionMode === 'move' && (
            <Animated.View entering={FadeIn.delay(1000).duration(500)} style={styles.tagSection}>
              <Text style={styles.tagLabel}>What did you do?</Text>
              <View style={styles.tagRow}>
                {ACTIVITY_TAGS.map((tag) => {
                  const active = selectedTag === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagChip,
                        active && styles.tagChipActive,
                      ]}
                      onPress={() => setSelectedTag(active ? null : tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tagText, active && styles.tagTextActive]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>
          )}

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
  rewardPill: {
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.4)',
    backgroundColor: 'rgba(125, 211, 252, 0.12)',
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  rewardText: {
    color: CALM_PRIMARY,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  rewardSubtext: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
  tagSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tagLabel: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.fontSize.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tagChipActive: {
    borderColor: 'rgba(52,211,153,0.60)',
    backgroundColor: 'rgba(52,211,153,0.15)',
  },
  tagText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500' as const,
  },
  tagTextActive: {
    color: MOVE_ACCENT,
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
