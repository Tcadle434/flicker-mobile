import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePlayerStore } from '../../src/stores/playerStore';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { Toggle } from '../../src/components/ui/Toggle';
import { useMoodTheme } from '../../src/hooks/useMoodTheme';
import { theme } from '../../src/constants/theme';

export default function Profile() {
  const { adaptiveEnabled, toggleAdaptive } = usePlayerStore();
  const moodTheme = useMoodTheme();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <StatusBar style="light" />
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Settings and account management</Text>

        <GlassCard moodTint style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: moodTheme.primary }]}>Audio</Text>
          <Toggle
            value={adaptiveEnabled}
            onValueChange={() => toggleAdaptive()}
            label="Adaptive Mode"
            description="Automatically adjusts mix based on time, weather, and activity."
          />
        </GlassCard>

        <GlassCard moodTint style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: moodTheme.primary }]}>Coming Soon</Text>
          <Text style={styles.sectionText}>
            {'• Background playback controls\n• HealthKit integration\n• Downloaded offline modes'}
          </Text>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.sm,
  },
  sectionText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
