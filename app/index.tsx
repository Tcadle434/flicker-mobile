import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuthStore, useSubscriptionStore } from '../src/stores';
import { useOnboardingStore } from '../src/stores/onboardingStore';

export default function Index() {
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const onboardingCompleted = useOnboardingStore((s) => s.completed);
  const initOnboarding = useOnboardingStore((s) => s.initialize);
  const isEntitled = useSubscriptionStore((s) => s.isEntitled);
  const isSubLoading = useSubscriptionStore((s) => s.isLoading);
  const initSubscription = useSubscriptionStore((s) => s.initialize);

  const [onboardingReady, setOnboardingReady] = useState(false);

  useEffect(() => {
    initOnboarding().then(() => setOnboardingReady(true));
    initSubscription();
  }, []);

  useEffect(() => {
    if (authLoading || !onboardingReady || isSubLoading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/signin');
      return;
    }

    if (!onboardingCompleted || !isEntitled) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    router.replace('/(main)/home');
  }, [isAuthenticated, authLoading, onboardingReady, onboardingCompleted, isEntitled, isSubLoading]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
});
