import { useEffect, useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { MoodCheckIn } from '../../src/components/ui/MoodCheckIn';
import { theme } from '../../src/constants/theme';
import { setLastResetAt } from '../../src/services/storage/resetStorage';
import { useStreakStore } from '../../src/stores/streakStore';
import { useMoodStore } from '../../src/stores/moodStore';
import { useSessionStore } from '../../src/stores/sessionStore';

const MESSAGES = [
  'Carry this with you.',
  'Let the noise stay quiet.',
  'You are here. That is enough.',
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
      // Record without mood if user just taps Done
      recordReset(durationMinutes);
    }
    router.replace('/(main)/home');
  }, [router, moodRecorded, durationMinutes, recordReset]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Reset complete.</Text>
      <Text style={styles.message}>{message}</Text>

      <MoodCheckIn onSelect={handleMoodSelect} />

      <View style={styles.doneWrap}>
        <Button title="Done" onPress={handleDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.md,
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  doneWrap: {
    marginTop: theme.spacing.xl,
    width: '100%',
  },
});
