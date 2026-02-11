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
import { SessionMixer } from '../../src/components/ui/SessionMixer';
import { theme } from '../../src/constants/theme';
import { useMoodStore } from '../../src/stores/moodStore';
import { useSessionStore } from '../../src/stores/sessionStore';
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
  const [mixerVisible, setMixerVisible] = useState(false);

  const controllerRef = useRef<SessionFlowController | null>(null);
  const [stillRemaining, setStillRemaining] = useState(0);

  const durationMinutes = useMemo(() => {
    const raw = Array.isArray(params.duration) ? params.duration[0] : params.duration;
    const value = Number(raw ?? 3);
    return Number.isFinite(value) ? value : 3;
  }, [params.duration]);

  // Phase-driven animations
  const fadeTextOpacity = useSharedValue(1);
  const controlsOpacity = useSharedValue(0);
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
    };
  }, [durationMinutes]);

  // React to phase changes
  useEffect(() => {
    switch (phase) {
      case 'fade':
        visualOpacity.value = withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) });
        fadeTextOpacity.value = withTiming(0, { duration: 8000 });
        // Show controls 5s into fade phase
        setTimeout(() => {
          controlsOpacity.value = withTiming(0.5, { duration: 2000 });
        }, 5000);
        break;
      case 'still':
        controlsOpacity.value = withTiming(0.5, { duration: 1000 });
        break;
      case 'return':
        controlsOpacity.value = withTiming(0, { duration: 1000 });
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

  const controlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
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
          <SessionVisual mood={currentMood} padX={0} padY={0} />
        </Animated.View>

        <SafeAreaView style={styles.safeArea}>
          {/* Top row: timer + mixer button (visible during fade & still) */}
          {(phase === 'fade' || phase === 'still') && (
            <Animated.View style={[styles.topRow, controlsStyle]}>
              <Text style={styles.timer}>
                {formatTime(stillRemaining)}
              </Text>
              <TouchableOpacity
                style={styles.mixerButton}
                onPress={() => setMixerVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.eqBars}>
                  <View style={[styles.eqBar, styles.eqBarShort]} />
                  <View style={[styles.eqBar, styles.eqBarTall]} />
                  <View style={[styles.eqBar, styles.eqBarMedium]} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Fade phase text */}
          {phase === 'fade' && (
            <Animated.View style={[styles.centerText, fadeTextStyle]}>
              <Text style={styles.phaseText}>Entering your mental reset...</Text>
            </Animated.View>
          )}

          {/* Return phase text */}
          {phase === 'return' && (
            <Animated.View style={[styles.centerText, returnTextStyle]}>
              <Text style={styles.phaseText}>Welcome back.</Text>
            </Animated.View>
          )}
        </SafeAreaView>

        {/* Mixer overlay */}
        {mixerVisible && phase === 'still' && (
          <SessionMixer onClose={() => setMixerVisible(false)} />
        )}
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
  mixerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  eqBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 16,
  },
  eqBar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  eqBarShort: {
    height: 8,
  },
  eqBarTall: {
    height: 16,
  },
  eqBarMedium: {
    height: 12,
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
