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
import { theme } from '../../src/constants/theme';
import { useSessionStore } from '../../src/stores/sessionStore';
import { usePlayerStore } from '../../src/stores/playerStore';
import { SessionFlowController } from '../../src/controllers/SessionFlowController';
import ZenGardenScene from '../../src/components/world/ZenGardenScene';
import SessionMixer from '../../src/components/hud/SessionMixer';
import StandaloneSessionAudioPanel from '../../src/components/hud/StandaloneSessionAudioPanel';
import {
  getResetSessionAudioProfile,
  getResetSessionStandaloneLayer,
  getResetSessionTrackCatalog,
} from '../../src/services/audio/resetSessionAudioProfiles';
import type { ResetSessionAudioMode } from '../../src/types';
import {
  DEV_RELAX_SESSION_CONFIG,
  DEV_RELAX_SESSION_MINUTES,
} from '../../src/constants/devSession';

const RESET_SESSION_AUDIO_MODES: ResetSessionAudioMode[] = [
  'custom',
  '432hz',
  'binauralBeats',
];

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function ResetSession() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    duration?: string;
    devSession?: string;
  }>();
  const { setMode: setPlayerMode } = usePlayerStore();
  const resetSessionAudioMode = usePlayerStore((s) => s.resetSessionAudioMode);
  const setResetSessionAudioMode = usePlayerStore((s) => s.setResetSessionAudioMode);
  const cycleResetSessionStandaloneTrack = usePlayerStore((s) => s.cycleResetSessionStandaloneTrack);
  const resetResetSessionAudioState = usePlayerStore((s) => s.resetResetSessionAudioState);
  const phase = useSessionStore((s) => s.phase);
  const sessionId = useSessionStore((s) => s.sessionId);
  const setSessionMode = useSessionStore((s) => s.setMode);
  const abandonSession = useSessionStore((s) => s.abandonSession);
  const [mixerVisible, setMixerVisible] = useState(false);
  const [standalonePanelVisible, setStandalonePanelVisible] = useState(false);

  const controllerRef = useRef<SessionFlowController | null>(null);
  const [stillRemaining, setStillRemaining] = useState(0);
  const isDevSession = params.devSession === '1';

  const durationMinutes = useMemo(() => {
    const raw = Array.isArray(params.duration) ? params.duration[0] : params.duration;
    const fallback = isDevSession ? DEV_RELAX_SESSION_MINUTES : 3;
    const value = Number(raw ?? fallback);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }, [isDevSession, params.duration]);

  const currentAudioProfile = useMemo(
    () => getResetSessionAudioProfile(resetSessionAudioMode),
    [resetSessionAudioMode],
  );
  const standaloneLayer = useMemo(
    () => getResetSessionStandaloneLayer(resetSessionAudioMode),
    [resetSessionAudioMode],
  );

  const fadeTextOpacity = useSharedValue(1);
  const controlsOpacity = useSharedValue(0);
  const returnTextOpacity = useSharedValue(0);
  const visualOpacity = useSharedValue(0);

  useEffect(() => {
    const controller = new SessionFlowController(
      durationMinutes,
      isDevSession ? DEV_RELAX_SESSION_CONFIG : undefined,
    );
    controllerRef.current = controller;

    (async () => {
      try {
        setSessionMode('reset');
        await setPlayerMode('relax');
        resetResetSessionAudioState();
        await setResetSessionAudioMode('custom');
      } catch {
        // ignore, session still renders
      }
      controller.start();
    })();

    const displayInterval = setInterval(() => {
      if (controllerRef.current) {
        setStillRemaining(controllerRef.current.getStillRemaining());
      }
    }, 500);

    return () => {
      clearInterval(displayInterval);
      controller.dispose();
      resetResetSessionAudioState();
      if (useSessionStore.getState().status === 'active') {
        abandonSession();
      }
    };
  }, [
    durationMinutes,
    abandonSession,
    isDevSession,
    resetResetSessionAudioState,
    setPlayerMode,
    setResetSessionAudioMode,
    setSessionMode,
  ]);

  useEffect(() => {
    if (resetSessionAudioMode === 'custom') {
      setStandalonePanelVisible(false);
      return;
    }

    setMixerVisible(false);
  }, [resetSessionAudioMode]);

  useEffect(() => {
    switch (phase) {
      case 'fade':
        visualOpacity.value = withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) });
        fadeTextOpacity.value = withTiming(0, { duration: 8000 });
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
        useSessionStore.getState().setCompletedDurationMinutes(durationMinutes);
        router.replace('/(main)/home');
        break;
    }
  }, [phase, sessionId, durationMinutes, isDevSession, controlsOpacity, fadeTextOpacity, returnTextOpacity, router, visualOpacity]);

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

  const handleExitSession = () => {
    controllerRef.current?.dispose();
    resetResetSessionAudioState();
    abandonSession();
    router.replace('/(main)/home');
  };

  const handleModePress = (mode: ResetSessionAudioMode) => {
    if (mode === resetSessionAudioMode) {
      return;
    }

    void setResetSessionAudioMode(mode);
  };

  const handleAudioControlPress = () => {
    if (currentAudioProfile.showFullMixer) {
      setMixerVisible(true);
      return;
    }

    if (currentAudioProfile.showStandaloneVolumeControl) {
      setStandalonePanelVisible(true);
    }
  };

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.container}>
        <StatusBar style="light" />

        <Animated.View style={[StyleSheet.absoluteFill, visualStyle]}>
          <ZenGardenScene onReady={() => {}} />
        </Animated.View>

        <SafeAreaView style={styles.safeArea}>
          {(phase === 'fade' || phase === 'still') && (
            <Animated.View style={[styles.topRow, controlsStyle]}>
              <Text style={styles.timer}>
                {formatTime(stillRemaining)}
              </Text>

              <View style={styles.rightStack}>
                <TouchableOpacity
                  style={styles.exitButton}
                  onPress={handleExitSession}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exitButtonText}>Exit</Text>
                </TouchableOpacity>

                <View style={styles.audioModeRail}>
                  {RESET_SESSION_AUDIO_MODES.map((mode) => {
                    const profile = getResetSessionAudioProfile(mode);
                    const isSelected = mode === resetSessionAudioMode;
                    const rowStandaloneLayer = getResetSessionStandaloneLayer(mode);
                    const rowTrackCount = rowStandaloneLayer
                      ? getResetSessionTrackCatalog(mode)[rowStandaloneLayer].length
                      : 0;
                    const showTrackArrows =
                      isSelected &&
                      profile.showStandaloneVolumeControl &&
                      rowTrackCount > 1;

                    return (
                      <View key={mode} style={styles.audioModeRow}>
                        {showTrackArrows && (
                          <TouchableOpacity
                            style={styles.trackArrowButton}
                            onPress={() => void cycleResetSessionStandaloneTrack(-1)}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.trackArrowText}>{'<'}</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={[
                            styles.audioModeBubble,
                            isSelected && styles.audioModeBubbleActive,
                          ]}
                          onPress={() => handleModePress(mode)}
                          activeOpacity={0.78}
                        >
                          <Text
                            style={[
                              styles.audioModeBubbleText,
                              isSelected && styles.audioModeBubbleTextActive,
                            ]}
                          >
                            {profile.label}
                          </Text>
                        </TouchableOpacity>

                        {showTrackArrows && (
                          <TouchableOpacity
                            style={styles.trackArrowButton}
                            onPress={() => void cycleResetSessionStandaloneTrack(1)}
                            activeOpacity={0.75}
                          >
                            <Text style={styles.trackArrowText}>{'>'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>

                <TouchableOpacity
                  style={styles.mixerButton}
                  onPress={handleAudioControlPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.eqBars}>
                    <View style={[styles.eqBar, styles.eqBarShort]} />
                    <View style={[styles.eqBar, styles.eqBarTall]} />
                    <View style={[styles.eqBar, styles.eqBarMedium]} />
                  </View>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {phase === 'fade' && (
            <Animated.View style={[styles.centerText, fadeTextStyle]}>
              <Text style={styles.phaseText}>Entering your mental reset...</Text>
            </Animated.View>
          )}

          {phase === 'return' && (
            <Animated.View style={[styles.centerText, returnTextStyle]}>
              <Text style={styles.phaseText}>Welcome back.</Text>
            </Animated.View>
          )}
        </SafeAreaView>

        {mixerVisible && resetSessionAudioMode === 'custom' && (
          <SessionMixer onClose={() => setMixerVisible(false)} />
        )}

        {standalonePanelVisible && resetSessionAudioMode !== 'custom' && (
          <StandaloneSessionAudioPanel onClose={() => setStandalonePanelVisible(false)} visible />
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  timer: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    letterSpacing: 2,
  },
  rightStack: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  exitButton: {
    height: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  exitButtonText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: theme.typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  audioModeRail: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  audioModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  audioModeBubble: {
    minWidth: 104,
    minHeight: 42,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  audioModeBubbleActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.18)',
    borderColor: 'rgba(94, 234, 212, 0.46)',
  },
  audioModeBubbleText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    textAlign: 'center',
    lineHeight: 16,
  },
  audioModeBubbleTextActive: {
    color: theme.colors.text,
  },
  trackArrowButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  trackArrowText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
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
