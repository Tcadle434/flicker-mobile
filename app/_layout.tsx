import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { useAuthStore, useStreakStore } from '../src/stores';
import { useSessionStore } from '../src/stores/sessionStore';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { useAudioSettingsStore } from '../src/stores/audioSettingsStore';
import { scheduleStreakReminder } from '../src/services/notifications/notificationService';
import {
  hydrateAuthenticatedUserData,
  resetAuthenticatedUserData,
} from '../src/services/app/userDataHydration';
import { paywallService } from '../src/services/subscription/paywallService';
import { audioCoordinator } from '../src/services/audio/audioCoordinator';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Toriko: require('../assets/fonts/Toriko.ttf'),
  });

  const initialize = useAuthStore((state) => state.initialize);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authLoading = useAuthStore((state) => state.isLoading);
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  const refreshEntitlement = useSubscriptionStore((state) => state.refreshEntitlement);
  const fetchStreak = useStreakStore((state) => state.fetchStreak);
  const hydrateAudioSettings = useAudioSettingsStore((state) => state.hydrate);
  const audioHydrated = useAudioSettingsStore((state) => state.isHydrated);
  const isMuted = useAudioSettingsStore((state) => state.isMuted);
  const appStateRef = useRef(AppState.currentState);
  const segments = useSegments();
  const inSessionRoute = segments[0] === '(session)';

  useEffect(() => {
    let isCancelled = false;

    const boot = async () => {
      paywallService.initialize().catch(() => undefined);
      hydrateSession();
      hydrateAudioSettings();
      scheduleStreakReminder();

      await initialize();
      if (isCancelled) return;
    };

    boot().catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [hydrateAudioSettings, hydrateSession, initialize]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      resetAuthenticatedUserData();
      return;
    }

    hydrateAuthenticatedUserData().catch(() => undefined);
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!audioHydrated) return;
    void audioCoordinator.initialize().catch(() => undefined);
  }, [audioHydrated]);

  useEffect(() => {
    if (!audioHydrated) return;
    void audioCoordinator.setMuted(isMuted).catch(() => undefined);
  }, [audioHydrated, isMuted]);

  useEffect(() => {
    if (!audioHydrated) return;
    if (inSessionRoute) {
      void audioCoordinator.leaveShell().catch(() => undefined);
      return;
    }

    void audioCoordinator.enterShell().catch(() => undefined);
  }, [audioHydrated, inSessionRoute]);

  // Refresh entitlement when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        refreshEntitlement();
        if (!authLoading && isAuthenticated) {
          void fetchStreak({ force: true }).catch(() => undefined);
        }
      }
      void audioCoordinator.handleAppStateChange(nextState).catch(() => undefined);
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [authLoading, fetchStreak, isAuthenticated, refreshEntitlement]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0A0A0B' },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(main)" />
            <Stack.Screen name="(session)" />
            <Stack.Screen name="reset-password" options={{ gestureEnabled: false }} />
          </Stack>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
