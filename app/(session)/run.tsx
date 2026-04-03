import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { theme } from '../../src/constants/theme';
import { useMoodStore } from '../../src/stores/moodStore';
import { useSessionStore } from '../../src/stores/sessionStore';
import { usePlayerStore } from '../../src/stores/playerStore';
import { useSpotifyStore } from '../../src/stores/spotifyStore';
import type { SoundscapeMode } from '../../src/types';

type TimerMode = 'focus' | 'move';

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
    subtitle: 'Stay with one thing.',
    activity: 'focus',
    audioMode: 'focus',
    accent: '#5EEAD4',
  },
  move: {
    title: 'Move',
    subtitle: 'Keep moving.',
    activity: 'move',
    audioMode: 'focus', // temp: no dedicated move manifest yet
    accent: '#34D399',
  },
};

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

type TimerDisplay = 'countdown' | 'countup';

// ── Pomodoro blocks ─────────────────────────────────────────
interface PomodoroBlock {
  type: 'focus' | 'break';
  durationSeconds: number;
}

const POMODORO_FOCUS_MIN = 25;
const POMODORO_BREAK_MIN = 5;

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
  return blocks.filter((b) => b.type === 'focus').length;
}

function focusBlockIndex(blocks: PomodoroBlock[], currentIndex: number): number {
  let count = 0;
  for (let i = 0; i <= currentIndex; i++) {
    if (blocks[i].type === 'focus') count++;
  }
  return count;
}

const RING_SIZE = 280;

export default function ModeSessionRun() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: TimerMode;
    duration?: string;
    pomodoro?: string;
    audio?: string;
  }>();
  const currentMood = useMoodStore((s) => s.currentMood);
  const fallbackDuration = useSessionStore((s) => s.durationMinutes);
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionStatus = useSessionStore((s) => s.status);
  const setSessionMode = useSessionStore((s) => s.setMode);
  const setDuration = useSessionStore((s) => s.setDuration);
  const startSession = useSessionStore((s) => s.startSession);
  const tick = useSessionStore((s) => s.tick);
  const pauseSession = useSessionStore((s) => s.pauseSession);
  const resumeSession = useSessionStore((s) => s.resumeSession);
  const completeSession = useSessionStore((s) => s.completeSession);
  const abandonSession = useSessionStore((s) => s.abandonSession);

  const setAudioMode = usePlayerStore((s) => s.setMode);
  const playAudio = usePlayerStore((s) => s.play);
  const pauseAudio = usePlayerStore((s) => s.pause);
  const stopAudio = usePlayerStore((s) => s.stop);

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

  const resumeSpotify = useSpotifyStore((s) => s.resumePlayback);
  const pauseSpotify = useSpotifyStore((s) => s.pausePlayback);
  const connectSpotify = useSpotifyStore((s) => s.connectSpotify);

  const details = MODE_DETAILS[mode];
  const isMove = mode === 'move';
  const isSpotify = params.audio === 'spotify';
  const isSilent = params.audio === 'silence' || isSpotify; // Spotify replaces native audio
  const audioModeOverride = params.audio as string | undefined;

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [timerDisplay, setTimerDisplay] = useState<TimerDisplay>('countdown');

  // Pomodoro state
  const [blockIndex, setBlockIndex] = useState(0);
  const [blockElapsed, setBlockElapsed] = useState(0);

  const currentBlock = pomodoroEnabled ? pomodoroBlocks[blockIndex] : null;
  const isBreak = currentBlock?.type === 'break';
  const blockRemaining = currentBlock
    ? Math.max(0, currentBlock.durationSeconds - blockElapsed)
    : 0;
  const blockProgress = currentBlock
    ? Math.min(1, blockElapsed / currentBlock.durationSeconds)
    : 0;

  // Standard timer values (non-pomodoro)
  const remainingSeconds = Math.max(0, targetSeconds - elapsedSeconds);
  const targetMet = elapsedSeconds >= targetSeconds;

  const progress = useMemo(() => {
    if (pomodoroEnabled) return blockProgress;
    if (targetSeconds <= 0) return 0;
    return Math.max(0, Math.min(1, elapsedSeconds / targetSeconds));
  }, [pomodoroEnabled, blockProgress, elapsedSeconds, targetSeconds]);

  const displayTime = useMemo(() => {
    if (pomodoroEnabled) return formatTime(blockRemaining);
    if (isMove && timerDisplay === 'countup') return formatTime(elapsedSeconds);
    return formatTime(remainingSeconds);
  }, [pomodoroEnabled, blockRemaining, isMove, timerDisplay, elapsedSeconds, remainingSeconds]);

  const ringColor = isBreak ? '#A78BFA' : details.accent;

  // Session lifecycle
  useEffect(() => {
    setSessionMode(mode);
    setDuration(durationMinutes);
    startSession({ mode, durationMinutes, targetSeconds, phase: 'active' });
    tick(0);

    if (isSpotify) {
      // Connect and resume Spotify playback (best-effort)
      void connectSpotify()
        .then((connected) => { if (connected) resumeSpotify(); })
        .catch(() => undefined);
    } else if (!isSilent) {
      const audioMode = (audioModeOverride && audioModeOverride !== 'silence')
        ? audioModeOverride as SoundscapeMode
        : details.audioMode;
      void setAudioMode(audioMode)
        .then(() => playAudio())
        .catch(() => undefined);
    }

    return () => {
      if (isSpotify) {
        // Pause (not stop) Spotify — user may want to keep listening
        pauseSpotify().catch(() => undefined);
      } else {
        stopAudio();
      }
      if (useSessionStore.getState().status === 'active') {
        abandonSession();
      }
    };
  }, [
    mode, durationMinutes, targetSeconds, isSilent, isSpotify, audioModeOverride,
    setSessionMode, setDuration, startSession, tick,
    setAudioMode, details.audioMode, playAudio, stopAudio, abandonSession,
    connectSpotify, resumeSpotify, pauseSpotify,
  ]);

  // Timer tick
  useEffect(() => {
    if (!isRunning || sessionStatus !== 'active') return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        tick(next);

        if (pomodoroEnabled) {
          // Pomodoro: advance within block
          setBlockElapsed((be) => {
            const nextBe = be + 1;
            const block = pomodoroBlocks[blockIndex];
            if (block && nextBe >= block.durationSeconds) {
              // Block complete → advance
              const nextBlockIdx = blockIndex + 1;
              if (nextBlockIdx >= pomodoroBlocks.length) {
                completeSession();
              } else {
                setBlockIndex(nextBlockIdx);
                setBlockElapsed(0);
              }
            }
            return nextBe;
          });
        } else if ((!isMove || timerDisplay === 'countdown') && next >= targetSeconds) {
          // Focus always auto-completes at target. Move auto-completes only in countdown display mode.
          completeSession();
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    isRunning, sessionStatus, completeSession, tick, targetSeconds,
    isMove, pomodoroEnabled, pomodoroBlocks, blockIndex,
    timerDisplay,
  ]);

  // Navigate on completion
  useEffect(() => {
    if (sessionStatus !== 'completed') return;
    if (isSpotify) {
      pauseSpotify().catch(() => undefined);
    } else {
      stopAudio();
    }

    // For pomodoro, pass total focus minutes (excluding breaks)
    let actualDuration = durationMinutes;
    if (pomodoroEnabled) {
      actualDuration = pomodoroBlocks
        .filter((b) => b.type === 'focus')
        .reduce((sum, b) => sum + b.durationSeconds / 60, 0);
    } else if (isMove) {
      actualDuration = Math.ceil(elapsedSeconds / 60);
    }

    useSessionStore.getState().setCompletedDurationMinutes(actualDuration);
    router.replace('/(main)/home');
  }, [
    sessionStatus, router, sessionId, mode, durationMinutes,
    stopAudio, isMove, elapsedSeconds, pomodoroEnabled, pomodoroBlocks,
    isSpotify, pauseSpotify,
  ]);

  const togglePause = useCallback(() => {
    if (sessionStatus !== 'active' && sessionStatus !== 'paused') return;
    if (isRunning) {
      if (isSpotify) {
        pauseSpotify().catch(() => undefined);
      } else if (!isSilent) {
        pauseAudio();
      }
      pauseSession();
      setIsRunning(false);
    } else {
      if (isSpotify) {
        resumeSpotify().catch(() => undefined);
      } else if (!isSilent) {
        void playAudio().catch(() => undefined);
      }
      resumeSession();
      setIsRunning(true);
    }
  }, [isRunning, sessionStatus, isSpotify, pauseAudio, playAudio, isSilent, pauseSession, resumeSession, pauseSpotify, resumeSpotify]);

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

  // Build subtitle/block label
  const subtitleText = useMemo(() => {
    if (pomodoroEnabled && currentBlock) {
      if (isBreak) return 'Take a breather.';
      return `Focus ${focusBlockIndex(pomodoroBlocks, blockIndex)} of ${totalFocusBlocks}`;
    }
    return details.subtitle;
  }, [pomodoroEnabled, currentBlock, isBreak, pomodoroBlocks, blockIndex, totalFocusBlocks, details.subtitle]);

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <View style={styles.root}>
        <StatusBar style="light" />

        <SafeAreaView style={styles.container}>
          {/* Top row */}
          <Animated.View entering={FadeIn.delay(300).duration(500)} style={styles.topRow}>
            <TouchableOpacity onPress={exitEarly} style={styles.exitButton} activeOpacity={0.75}>
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
            <Text style={[styles.modeLabel, { color: `${ringColor}AA` }]}>
              {isBreak ? 'Break' : details.title}
            </Text>
            <View style={styles.spacer} />
          </Animated.View>

          {/* Center: ring + timer + character */}
          <View style={styles.center}>
            {/* Count-up / Count-down toggle for Move mode */}
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

            {/* Timer */}
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

          {/* Bottom */}
          <Animated.View entering={FadeIn.delay(400).duration(500)} style={styles.bottom}>
            {isMove && targetMet ? (
              <TouchableOpacity
                style={[styles.primaryButton, { borderColor: details.accent, backgroundColor: `${details.accent}18` }]}
                onPress={finishMove}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryButtonText, { color: details.accent }]}>
                  Finish
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryButton, { borderColor: `${ringColor}70` }]}
                onPress={togglePause}
                activeOpacity={0.8}
              >
                <Text style={[styles.primaryButtonText, { color: ringColor }]}>
                  {isRunning ? 'Pause' : 'Resume'}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
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
  spacer: { width: 60 },

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
  characterWrap: {
    marginTop: theme.spacing.lg,
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
