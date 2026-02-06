import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SessionVisual } from '../../src/components/visuals/SessionVisual';
import { SoundPad } from '../../src/components/ui/SoundPad';
import { theme } from '../../src/constants/theme';
import { useMoodStore } from '../../src/stores/moodStore';
import { useSessionStore } from '../../src/stores/sessionStore';
import { useSoundPadStore } from '../../src/stores/soundPadStore';
import { usePlayerStore } from '../../src/stores/playerStore';
import { SessionFlowController } from '../../src/controllers/SessionFlowController';

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ResetSession() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setMode } = usePlayerStore();
  const currentMood = useMoodStore((s) => s.currentMood);
  const phase = useSessionStore((s) => s.phase);
  const padVisible = useSoundPadStore((s) => s.visible);
  const padX = useSoundPadStore((s) => s.x);
  const padY = useSoundPadStore((s) => s.y);
  const togglePad = useSoundPadStore((s) => s.toggle);
  const resetPad = useSoundPadStore((s) => s.reset);

  const controllerRef = useRef<SessionFlowController | null>(null);
  const [stillRemaining, setStillRemaining] = useState(0);

  const durationMinutes = useMemo(() => {
    const raw = Array.isArray(params.duration) ? params.duration[0] : params.duration;
    const value = Number(raw ?? 3);
    return Number.isFinite(value) ? value : 3;
  }, [params.duration]);

  // Phase-driven animations
  const fadeTextOpacity = useSharedValue(1);
  const timerOpacity = useSharedValue(0);
  const returnTextOpacity = useSharedValue(0);
  const visualOpacity = useSharedValue(0);

  useEffect(() => {
    // Setup audio mode and start session
    (async () => {
      try {
        await setMode('focus');
      } catch {
        // ignore, session still renders
      }
    })();

    const controller = new SessionFlowController(durationMinutes);
    controllerRef.current = controller;
    controller.start();

    // Update still timer display
    const displayInterval = setInterval(() => {
      if (controllerRef.current) {
        setStillRemaining(controllerRef.current.getStillRemaining());
      }
    }, 500);

    return () => {
      clearInterval(displayInterval);
      controller.dispose();
      resetPad();
    };
  }, [durationMinutes]);

  // React to phase changes
  useEffect(() => {
    switch (phase) {
      case 'fade':
        visualOpacity.value = withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) });
        fadeTextOpacity.value = withTiming(0, { duration: 8000 });
        break;
      case 'still':
        timerOpacity.value = withTiming(0.4, { duration: 1000 });
        break;
      case 'return':
        timerOpacity.value = withTiming(0, { duration: 1000 });
        returnTextOpacity.value = withTiming(1, { duration: 3000 });
        break;
      case 'complete':
        router.replace('/complete');
        break;
    }
  }, [phase]);

  const fadeTextStyle = useAnimatedStyle(() => ({
    opacity: fadeTextOpacity.value,
  }));

  const timerStyle = useAnimatedStyle(() => ({
    opacity: timerOpacity.value,
  }));

  const returnTextStyle = useAnimatedStyle(() => ({
    opacity: returnTextOpacity.value,
  }));

  const visualStyle = useAnimatedStyle(() => ({
    opacity: visualOpacity.value,
  }));

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Session visual background */}
        <Animated.View style={[StyleSheet.absoluteFill, visualStyle]}>
          <SessionVisual mood={currentMood} padX={padX} padY={padY} />
        </Animated.View>

        <SafeAreaView style={styles.safeArea}>
          {/* Fade phase text */}
          {phase === 'fade' && (
            <Animated.View style={[styles.centerText, fadeTextStyle]}>
              <Text style={styles.phaseText}>Entering your mental reset...</Text>
            </Animated.View>
          )}

          {/* Still phase UI */}
          {phase === 'still' && (
            <View style={styles.topRow}>
              <Animated.Text style={[styles.timer, timerStyle]}>
                {formatTime(stillRemaining)}
              </Animated.Text>
              <TouchableOpacity
                style={styles.padIcon}
                onPress={togglePad}
              >
                <View style={styles.padIconOrb}>
                  <View style={styles.padIconCore} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Return phase text */}
          {phase === 'return' && (
            <Animated.View style={[styles.centerText, returnTextStyle]}>
              <Text style={styles.phaseText}>Welcome back.</Text>
            </Animated.View>
          )}
        </SafeAreaView>

        {/* Sound pad overlay */}
        {padVisible && phase === 'still' && <SoundPad />}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  topRow: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timer: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    letterSpacing: 2,
  },
  padIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  padIconOrb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(160, 210, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ffffff',
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  padIconCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  centerText: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.light,
    letterSpacing: 1,
  },
});
