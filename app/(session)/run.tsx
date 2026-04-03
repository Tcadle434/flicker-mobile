import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { theme } from '../../src/constants/theme';
import { useSessionStore } from '../../src/stores/sessionStore';
import { usePlayerStore } from '../../src/stores/playerStore';
import { useSpotifyStore } from '../../src/stores/spotifyStore';
import ZenGardenScene from '../../src/components/world/ZenGardenScene';
import StandaloneSessionAudioPanel from '../../src/components/hud/StandaloneSessionAudioPanel';
import type { SoundscapeMode } from '../../src/types';

type TimerMode = 'focus' | 'move';
type TimerDisplay = 'countdown' | 'countup';

const MODE_DETAILS: Record<
  TimerMode,
  {
    title: string;
    subtitle: string;
    activity: 'focus' | 'move';
    audioMode: SoundscapeMode;
    accent: string;
  }
> = {
  focus: {
    title: 'Focus',
    subtitle: 'Protect your time. Find your productivity.',
    activity: 'focus',
    audioMode: 'focus',
    accent: '#5EEAD4',
  },
  move: {
    title: 'Move',
    subtitle: 'Keep moving.',
    activity: 'move',
    audioMode: 'focus',
    accent: '#34D399',
  },
};

interface PomodoroBlock {
  type: 'focus' | 'break';
  durationSeconds: number;
}

const POMODORO_FOCUS_MIN = 25;
const POMODORO_BREAK_MIN = 5;
const RING_SIZE = 280;

function parseMode(value: string | string[] | undefined): TimerMode {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'move') return 'move';
  return 'focus';
}

function parseDurationMinutes(value: string | string[] | undefined, fallback: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function buildPomodoroBlocks(totalMinutes: number): PomodoroBlock[] {
  const blocks: PomodoroBlock[] = [];
  let remaining = totalMinutes;

  while (remaining > 0) {
    const focusDuration = Math.min(POMODORO_FOCUS_MIN, remaining);
    blocks.push({ type: 'focus', durationSeconds: focusDuration * 60 });
    remaining -= focusDuration;

    if (remaining > 0) {
      const breakDuration = Math.min(POMODORO_BREAK_MIN, remaining);
      blocks.push({ type: 'break', durationSeconds: breakDuration * 60 });
      remaining -= breakDuration;
    }
  }

  return blocks;
}

function countFocusBlocks(blocks: PomodoroBlock[]): number {
  return blocks.filter((block) => block.type === 'focus').length;
}

function focusBlockIndex(blocks: PomodoroBlock[], currentIndex: number): number {
  let count = 0;
  for (let i = 0; i <= currentIndex; i += 1) {
    if (blocks[i].type === 'focus') count += 1;
  }
  return count;
}

export default function ModeSessionRun() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: TimerMode;
    duration?: string;
    pomodoro?: string;
    audio?: string;
  }>();

  const fallbackDuration = useSessionStore((s) => s.durationMinutes);
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionStatus = useSessionStore((s) => s.status);
  const setSessionMode = useSessionStore((s) => s.setMode);
  const setDuration = useSessionStore((s) => s.setDuration);
  const startSession = useSessionStore((s) => s.startSession);
  const tick = useSessionStore((s) => s.tick);
  const completeSession = useSessionStore((s) => s.completeSession);
  const abandonSession = useSessionStore((s) => s.abandonSession);

  const setAudioMode = usePlayerStore((s) => s.setMode);
  const playAudio = usePlayerStore((s) => s.play);
  const stopAudio = usePlayerStore((s) => s.stop);
  const layers = usePlayerStore((s) => s.layers);
  const setLayerLoop = usePlayerStore((s) => s.setLayerLoop);
  const setLayerVolume = usePlayerStore((s) => s.setLayerVolume);

  const resumeSpotify = useSpotifyStore((s) => s.resumePlayback);
  const pauseSpotify = useSpotifyStore((s) => s.pausePlayback);
  const connectSpotify = useSpotifyStore((s) => s.connectSpotify);

  const mode = useMemo<TimerMode>(() => parseMode(params.mode), [params.mode]);
  const durationMinutes = useMemo(
    () => parseDurationMinutes(params.duration, fallbackDuration),
    [params.duration, fallbackDuration],
  );
  const targetSeconds = useMemo(
    () => Math.max(1, Math.round(durationMinutes * 60)),
    [durationMinutes],
  );
  const pomodoroEnabled = mode === 'focus' && params.pomodoro === '1';
  const pomodoroBlocks = useMemo(
    () => (pomodoroEnabled ? buildPomodoroBlocks(durationMinutes) : []),
    [pomodoroEnabled, durationMinutes],
  );
  const totalFocusBlocks = useMemo(() => countFocusBlocks(pomodoroBlocks), [pomodoroBlocks]);
  const details = MODE_DETAILS[mode];
  const isMove = mode === 'move';
  const isSpotify = params.audio === 'spotify';
  const isSilent = params.audio === 'silence' || isSpotify;
  const audioModeOverride = params.audio as string | undefined;
  const nativeAudioMode = useMemo<SoundscapeMode | null>(() => {
    if (isSilent) {
      return null;
    }

    if (audioModeOverride && audioModeOverride !== 'spotify' && audioModeOverride !== 'silence') {
      return audioModeOverride as SoundscapeMode;
    }

    return details.audioMode;
  }, [audioModeOverride, details.audioMode, isSilent]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerDisplay, setTimerDisplay] = useState<TimerDisplay>('countdown');
  const [blockIndex, setBlockIndex] = useState(0);
  const [blockElapsed, setBlockElapsed] = useState(0);
  const [focusAudioPanelVisible, setFocusAudioPanelVisible] = useState(false);

  const currentBlock = pomodoroEnabled ? pomodoroBlocks[blockIndex] : null;
  const isBreak = currentBlock?.type === 'break';
  const blockRemaining = currentBlock
    ? Math.max(0, currentBlock.durationSeconds - blockElapsed)
    : 0;
  const blockProgress = currentBlock
    ? Math.min(1, blockElapsed / currentBlock.durationSeconds)
    : 0;

  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const targetMet = elapsedSeconds >= targetSeconds;
  const showFocusIntroCard = elapsedSeconds < 5;
  const displayTime = useMemo(() => {
    if (pomodoroEnabled) return formatTime(blockRemaining);
    if (isMove && timerDisplay === 'countup') return formatTime(elapsedSeconds);
    return formatTime(remainingSeconds);
  }, [pomodoroEnabled, blockRemaining, isMove, timerDisplay, elapsedSeconds, remainingSeconds]);

  const ringColor = isBreak ? '#A78BFA' : details.accent;
  const subtitleText = useMemo(() => {
    if (pomodoroEnabled && currentBlock) {
      if (isBreak) return 'Take a breather.';
      return `Focus ${focusBlockIndex(pomodoroBlocks, blockIndex)} of ${totalFocusBlocks}`;
    }
    return details.subtitle;
  }, [pomodoroEnabled, currentBlock, isBreak, pomodoroBlocks, blockIndex, totalFocusBlocks, details.subtitle]);

  const focusLayer = layers.ambient;
  const currentFocusTrack = useMemo(
    () =>
      focusLayer.availableTracks.find((track) => track.id === focusLayer.currentLoopId) ??
      focusLayer.availableTracks[0] ??
      null,
    [focusLayer.availableTracks, focusLayer.currentLoopId],
  );
  const showFocusAudioControls =
    mode === 'focus' && nativeAudioMode === 'focus' && !isSpotify && !isSilent;
  const canCycleFocusTracks = showFocusAudioControls && focusLayer.availableTracks.length > 1;

  useEffect(() => {
    if (!showFocusAudioControls) {
      setFocusAudioPanelVisible(false);
    }
  }, [showFocusAudioControls]);

  useEffect(() => {
    setSessionMode(mode);
    setDuration(durationMinutes);
    startSession({ mode, durationMinutes, targetSeconds, phase: 'active' });
    tick(0);

    if (isSpotify) {
      void connectSpotify()
        .then((connected) => {
          if (connected) {
            return resumeSpotify();
          }
          return undefined;
        })
        .catch(() => undefined);
    } else if (!isSilent && nativeAudioMode) {
      void setAudioMode(nativeAudioMode)
        .then(() => playAudio())
        .catch(() => undefined);
    }

    return () => {
      if (isSpotify) {
        pauseSpotify().catch(() => undefined);
      } else {
        stopAudio();
      }

      if (useSessionStore.getState().status === 'active') {
        abandonSession();
      }
    };
  }, [
    mode,
    durationMinutes,
    targetSeconds,
    isSilent,
    isSpotify,
    nativeAudioMode,
    setSessionMode,
    setDuration,
    startSession,
    tick,
    setAudioMode,
    playAudio,
    stopAudio,
    abandonSession,
    connectSpotify,
    resumeSpotify,
    pauseSpotify,
  ]);

  useEffect(() => {
    if (sessionStatus !== 'active') return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        tick(next);

        if (pomodoroEnabled) {
          setBlockElapsed((previousBlockElapsed) => {
            const nextBlockElapsed = previousBlockElapsed + 1;
            const block = pomodoroBlocks[blockIndex];

            if (block && nextBlockElapsed >= block.durationSeconds) {
              const nextBlockIndex = blockIndex + 1;
              if (nextBlockIndex >= pomodoroBlocks.length) {
                completeSession();
              } else {
                setBlockIndex(nextBlockIndex);
                setBlockElapsed(0);
              }
            }

            return nextBlockElapsed;
          });
        } else if ((!isMove || timerDisplay === 'countdown') && next >= targetSeconds) {
          completeSession();
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    sessionStatus,
    completeSession,
    tick,
    targetSeconds,
    isMove,
    pomodoroEnabled,
    pomodoroBlocks,
    blockIndex,
    timerDisplay,
  ]);

  useEffect(() => {
    if (sessionStatus !== 'completed') return;

    if (isSpotify) {
      pauseSpotify().catch(() => undefined);
    } else {
      stopAudio();
    }

    let actualDuration = durationMinutes;
    if (pomodoroEnabled) {
      actualDuration = pomodoroBlocks
        .filter((block) => block.type === 'focus')
        .reduce((sum, block) => sum + block.durationSeconds / 60, 0);
    } else if (isMove) {
      actualDuration = Math.ceil(elapsedSeconds / 60);
    }

    useSessionStore.getState().setCompletedDurationMinutes(actualDuration);
    router.replace('/(main)/home');
  }, [
    sessionStatus,
    router,
    sessionId,
    durationMinutes,
    stopAudio,
    isMove,
    elapsedSeconds,
    pomodoroEnabled,
    pomodoroBlocks,
    isSpotify,
    pauseSpotify,
  ]);

  const finishMove = useCallback(() => {
    if (!targetMet) return;
    completeSession();
  }, [targetMet, completeSession]);

  const exitEarly = useCallback(() => {
    if (isSpotify) {
      pauseSpotify().catch(() => undefined);
    } else {
      stopAudio();
    }

    abandonSession();
    router.replace('/(main)/home');
  }, [abandonSession, router, stopAudio, isSpotify, pauseSpotify]);

  const cycleFocusTrack = useCallback(
    (direction: -1 | 1) => {
      if (!canCycleFocusTracks) {
        return;
      }

      const currentIndex = focusLayer.availableTracks.findIndex(
        (track) => track.id === focusLayer.currentLoopId,
      );
      const startIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex =
        (startIndex + direction + focusLayer.availableTracks.length) %
        focusLayer.availableTracks.length;
      const nextTrack = focusLayer.availableTracks[nextIndex];

      if (nextTrack) {
        void setLayerLoop('ambient', nextTrack.id);
      }
    },
    [canCycleFocusTracks, focusLayer.availableTracks, focusLayer.currentLoopId, setLayerLoop],
  );

  if (mode === 'focus') {
    return (
      <>
        <Stack.Screen options={{ gestureEnabled: false }} />
        <View style={styles.root}>
          <StatusBar style="light" />

          <Animated.View entering={FadeIn.duration(500)} style={StyleSheet.absoluteFill}>
            <ZenGardenScene variant="focus" onReady={() => {}} />
          </Animated.View>

          <SafeAreaView style={styles.container}>
            <Animated.View entering={FadeIn.delay(220).duration(500)} style={styles.focusTopRow}>
              <Text style={styles.sessionTimer}>{displayTime}</Text>

              <View style={styles.rightStack}>
                <TouchableOpacity
                  style={styles.exitGlassButton}
                  onPress={exitEarly}
                  activeOpacity={0.75}
                >
                  <Text style={styles.exitGlassText}>Exit</Text>
                </TouchableOpacity>

                {showFocusAudioControls && (
                  <View style={styles.audioModeRow}>
                    {canCycleFocusTracks && (
                      <TouchableOpacity
                        style={styles.trackArrowButton}
                        onPress={() => cycleFocusTrack(-1)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.trackArrowText}>{'<'}</Text>
                      </TouchableOpacity>
                    )}

                    <View style={[styles.audioModeBubble, styles.audioModeBubbleActive]}>
                      <Text style={[styles.audioModeBubbleText, styles.audioModeBubbleTextActive]}>
                        {currentFocusTrack?.label ?? 'Focus Audio'}
                      </Text>
                    </View>

                    {canCycleFocusTracks && (
                      <TouchableOpacity
                        style={styles.trackArrowButton}
                        onPress={() => cycleFocusTrack(1)}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.trackArrowText}>{'>'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {showFocusAudioControls && (
                  <TouchableOpacity
                    style={styles.audioControlButton}
                    onPress={() => setFocusAudioPanelVisible(true)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.eqBars}>
                      <View style={styles.eqBarShort} />
                      <View style={styles.eqBarTall} />
                      <View style={styles.eqBarMid} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>

            <View style={styles.focusCenter}>
              {showFocusIntroCard && (
                <Animated.View
                  entering={FadeInUp.delay(260).duration(520)}
                  exiting={FadeOut.duration(300)}
                  style={styles.focusInfoCard}
                >
                  <Text style={[styles.focusModeLabel, isBreak && styles.focusModeLabelBreak]}>
                    {isBreak ? 'Break' : details.title}
                  </Text>
                  <Text style={styles.focusHeadline}>
                    {isBreak ? 'A quiet pause.' : 'Settle into the nook.'}
                  </Text>
                  <Text style={[styles.focusSubtitle, isBreak && styles.focusSubtitleBreak]}>
                    {subtitleText}
                  </Text>
                </Animated.View>
              )}
            </View>
          </SafeAreaView>

          {showFocusAudioControls && (
            <StandaloneSessionAudioPanel
              visible={focusAudioPanelVisible}
              onClose={() => setFocusAudioPanelVisible(false)}
              title="Focus"
              subtitle="Looping focus audio"
              trackLabel={currentFocusTrack?.label ?? 'Unavailable'}
              volume={focusLayer.volume}
              sliderColor={details.accent}
              onVolumeChange={(value) => setLayerVolume('ambient', value)}
            />
          )}
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.root}>
        <StatusBar style="light" />

        <SafeAreaView style={styles.container}>
          <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.topRow}>
            <TouchableOpacity onPress={exitEarly} style={styles.exitButton} activeOpacity={0.75}>
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
            <Text style={[styles.modeLabel, { color: `${ringColor}AA` }]}>
              {isBreak ? 'Break' : details.title}
            </Text>
            <View style={styles.spacer} />
          </Animated.View>

          <View style={styles.center}>
            {isMove && (
              <Animated.View entering={FadeIn.delay(500).duration(400)} style={styles.displayToggle}>
                <TouchableOpacity
                  style={[
                    styles.displayToggleBtn,
                    timerDisplay === 'countdown' && styles.displayToggleBtnActive,
                  ]}
                  onPress={() => setTimerDisplay('countdown')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.displayToggleText,
                      timerDisplay === 'countdown' && { color: details.accent },
                    ]}
                  >
                    Remaining
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.displayToggleBtn,
                    timerDisplay === 'countup' && styles.displayToggleBtnActive,
                  ]}
                  onPress={() => setTimerDisplay('countup')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.displayToggleText,
                      timerDisplay === 'countup' && { color: details.accent },
                    ]}
                  >
                    Elapsed
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <View style={styles.ringWrap}>
              <View style={styles.timerOverlay}>
                <Text style={styles.timer}>{displayTime}</Text>
                {isMove && targetMet && (
                  <Text style={[styles.targetMetLabel, { color: details.accent }]}>
                    Target reached
                  </Text>
                )}
              </View>
            </View>

            <Animated.Text
              entering={FadeIn.delay(600).duration(500)}
              style={[styles.subtitle, isBreak && { color: '#A78BFA' }]}
            >
              {subtitleText}
            </Animated.Text>
          </View>

          {isMove && targetMet && (
            <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.bottom}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  {
                    borderColor: details.accent,
                    backgroundColor: `${details.accent}18`,
                  },
                ]}
                onPress={finishMove}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryButtonText, { color: details.accent }]}>Finish</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </SafeAreaView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  focusTopRow: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sessionTimer: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  rightStack: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  exitGlassButton: {
    height: 40,
    paddingHorizontal: theme.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  exitGlassText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: theme.typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: theme.typography.fontWeight.semibold,
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
  audioControlButton: {
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
    gap: 2,
    height: 14,
  },
  eqBarShort: {
    width: 3,
    height: 6,
    borderRadius: 2,
    backgroundColor: theme.colors.text,
  },
  eqBarMid: {
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: theme.colors.text,
  },
  eqBarTall: {
    width: 3,
    height: 13,
    borderRadius: 2,
    backgroundColor: theme.colors.text,
  },
  focusCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  focusInfoCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    backgroundColor: 'rgba(7, 12, 18, 0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  focusModeLabel: {
    color: '#5EEAD4',
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  focusModeLabelBreak: {
    color: '#C4B5FD',
  },
  focusHeadline: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  focusSubtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  focusSubtitleBreak: {
    color: 'rgba(196, 181, 253, 0.92)',
  },
  topRow: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exitButton: {
    minWidth: 60,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: theme.typography.fontSize.xs,
    letterSpacing: 0.8,
    fontWeight: theme.typography.fontWeight.medium,
    textTransform: 'uppercase',
  },
  modeLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  spacer: {
    width: 60,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.spacing.xxl,
  },
  displayToggle: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 2,
    marginBottom: theme.spacing.md,
  },
  displayToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
  },
  displayToggleBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  displayToggleText: {
    color: theme.colors.textTertiary,
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.3,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timer: {
    color: theme.colors.text,
    fontSize: 56,
    fontWeight: theme.typography.fontWeight.light,
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },
  targetMetLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitle: {
    marginTop: theme.spacing.md,
    color: theme.colors.textTertiary,
    fontSize: theme.typography.fontSize.md,
    letterSpacing: 0.3,
  },
  bottom: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  primaryButton: {
    height: theme.layout.buttonHeight,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
});
