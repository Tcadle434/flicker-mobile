import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { useAuthStore } from '../src/stores';
import { useCurrencyStore } from '../src/stores/currencyStore';
import { useSanctuaryStore } from '../src/stores/sanctuaryStore';
import { useTentStore } from '../src/stores/tentStore';
import { useSessionStore } from '../src/stores/sessionStore';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { useAudioSettingsStore } from '../src/stores/audioSettingsStore';
import { loadSanctuaryData } from '../src/services/sanctuary/sanctuaryLoader';
import { scheduleStreakReminder } from '../src/services/notifications/notificationService';
import { paywallService } from '../src/services/subscription/paywallService';
import {
  startBackgroundMusic,
  pauseBackgroundMusic,
  resumeBackgroundMusic,
  muteBackgroundMusic,
  unmuteBackgroundMusic,
} from '../src/services/audio/backgroundMusic';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Toriko: require('../assets/fonts/Toriko.ttf'),
  });

  const initialize = useAuthStore((state) => state.initialize);
  const hydrateCurrency = useCurrencyStore((state) => state.hydrate);
  const hydrateSanctuary = useSanctuaryStore((state) => state.hydrate);
  const hydrateTent = useTentStore((state) => state.hydrate);
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  const refreshEntitlement = useSubscriptionStore((state) => state.refreshEntitlement);
  const hydrateAudioSettings = useAudioSettingsStore((state) => state.hydrate);
  const audioHydrated = useAudioSettingsStore((state) => state.isHydrated);
  const isMuted = useAudioSettingsStore((state) => state.isMuted);
  const sessionStatus = useSessionStore((state) => state.status);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Initialize Superwall before any entitlement checks
    paywallService.initialize().catch(() => undefined);
    initialize();
    hydrateCurrency();
    hydrateSession();
    hydrateSanctuary().then(() => loadSanctuaryData());
    hydrateTent();
    hydrateAudioSettings();
    // Re-schedule daily streak reminder on every app boot
    scheduleStreakReminder();
  }, []);

  // Start background music once audio settings are hydrated
  useEffect(() => {
    if (audioHydrated) {
      startBackgroundMusic(isMuted);
    }
  }, [audioHydrated]);

  // Pause/resume background music based on session status
  useEffect(() => {
    if (sessionStatus === 'active' || sessionStatus === 'paused') {
      pauseBackgroundMusic();
    } else if (sessionStatus === 'idle' || sessionStatus === 'completed' || sessionStatus === 'abandoned') {
      resumeBackgroundMusic();
    }
  }, [sessionStatus]);

  // Mute/unmute background music reactively
  useEffect(() => {
    if (!audioHydrated) return;
    if (isMuted) {
      muteBackgroundMusic();
    } else {
      unmuteBackgroundMusic();
    }
  }, [isMuted, audioHydrated]);

  // Refresh entitlement when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        refreshEntitlement();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [refreshEntitlement]);

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
          </Stack>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
