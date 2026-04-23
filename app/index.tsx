import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuthStore, useSubscriptionStore } from '../src/stores';
import { useOnboardingStore } from '../src/stores/onboardingStore';

export default function Index() {
  const {
    user,
    isAuthenticated,
    hasAuthenticatedBefore,
    isLoading: authLoading,
  } = useAuthStore();
  const userId = user?.id ?? null;
  const onboardingCompleted = useOnboardingStore((s) => s.completed);
  const paywallAccepted = useOnboardingStore((s) => s.paywallAccepted);
  const initOnboarding = useOnboardingStore((s) => s.initialize);
  const finalizeOnboarding = useOnboardingStore((s) => s.finalizeOnboarding);
  const isEntitled = useSubscriptionStore((s) => s.isEntitled);
  const isSubLoading = useSubscriptionStore((s) => s.isLoading);
  const initSubscription = useSubscriptionStore((s) => s.initialize);
  const refreshEntitlement = useSubscriptionStore((s) => s.refreshEntitlement);

  const [onboardingReady, setOnboardingReady] = useState(false);
  const finalizeInFlightRef = useRef(false);
  const entitlementRecoveryUserRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setOnboardingReady(false);
    Promise.all([initOnboarding(), initSubscription()])
      .finally(() => {
        if (!cancelled) {
          setOnboardingReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initOnboarding, initSubscription, isAuthenticated]);

  useEffect(() => {
    if (authLoading || !onboardingReady || isSubLoading) return;

    if (!isAuthenticated) {
      entitlementRecoveryUserRef.current = null;
      if (paywallAccepted) {
        router.replace('/(auth)/signup?mode=postPaywallRequired');
        return;
      }

      router.replace(
        hasAuthenticatedBefore
          ? '/(auth)/signin?mode=default'
          : '/(onboarding)/welcome',
      );
      return;
    }

    if (isEntitled) {
      entitlementRecoveryUserRef.current = userId;
      if (!onboardingCompleted && !finalizeInFlightRef.current) {
        finalizeInFlightRef.current = true;
        void finalizeOnboarding().finally(() => {
          finalizeInFlightRef.current = false;
        });
      }

      router.replace('/(main)/home');
      return;
    }

    if (
      userId &&
      paywallAccepted &&
      !onboardingCompleted &&
      entitlementRecoveryUserRef.current !== userId
    ) {
      entitlementRecoveryUserRef.current = userId;
      void refreshEntitlement();
      return;
    }

    if (onboardingCompleted && !isEntitled) {
      router.replace('/(onboarding)/paywall');
      return;
    }

    if (!onboardingCompleted && paywallAccepted) {
      router.replace('/(onboarding)/paywall');
      return;
    }

    if (!onboardingCompleted) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    router.replace('/(main)/home');
  }, [
    isAuthenticated,
    hasAuthenticatedBefore,
    authLoading,
    onboardingReady,
    onboardingCompleted,
    paywallAccepted,
    finalizeOnboarding,
    isEntitled,
    isSubLoading,
    refreshEntitlement,
    userId,
  ]);

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
