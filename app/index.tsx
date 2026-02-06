import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuthStore } from '../src/stores';
import { Button } from '../src/components/ui';
import { theme } from '../src/constants/theme';
import { useEffect } from 'react';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace('/(main)/home');
    } else {
      router.replace('/(auth)/signin');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <Text style={styles.title}>Sona</Text>
        <Text style={styles.subtitle}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Sona</Text>
      <Text style={styles.subtitle}>Adaptive Ambient Music</Text>
      <Text style={styles.description}>
        Phase 1: Foundation Setup Complete ✅
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Sign In"
          onPress={() => router.push('/(auth)/signin')}
          style={styles.button}
        />
        <Button
          title="Create Account"
          onPress={() => router.push('/(auth)/signup')}
          variant="secondary"
          style={styles.button}
        />
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
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.regular,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  description: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    gap: theme.spacing.md,
  },
  button: {
    width: '100%',
  },
});
