import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appBlockingBridge } from '../services/appBlocking/appBlockingBridge';

export type SessionPhase = 'idle' | 'fade' | 'still' | 'return' | 'active' | 'complete';
export type SessionMode = 'reset' | 'focus' | 'move';
export type SessionStatus = 'idle' | 'active' | 'paused' | 'interrupted' | 'completed' | 'abandoned';

const FADE_IN_DURATION = 15;
const RETURN_DURATION = 25;
const STORAGE_KEY = '@flicker:active_session';

interface PersistedSession {
  sessionId: string;
  mode: SessionMode;
  phase: SessionPhase;
  durationMinutes: number;
  targetSeconds: number;
  elapsed: number;
  startedAt: number; // timestamp to recompute elapsed on restore
}

interface SessionStore {
  sessionId: string | null;
  mode: SessionMode;
  status: SessionStatus;
  phase: SessionPhase;
  durationMinutes: number;
  completedDurationMinutes: number;
  targetSeconds: number;
  elapsed: number;
  totalRemaining: number;
  fadeInDuration: number;
  returnDuration: number;
  startedAt: number;

  setMode: (mode: SessionMode) => void;
  setDuration: (minutes: number) => void;
  setCompletedDurationMinutes: (minutes: number) => void;
  startSession: (input?: {
    mode?: SessionMode;
    phase?: SessionPhase;
    durationMinutes?: number;
    targetSeconds?: number;
  }) => void;
  tick: (elapsed: number) => void;
  advancePhase: (phase: SessionPhase) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  interruptSession: () => void;
  completeSession: () => void;
  abandonSession: () => void;
  resetSession: () => void;
  hydrateSession: () => Promise<void>;
}

function createSessionId(): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `session_${Date.now()}_${suffix}`;
}

async function persistSession(state: {
  sessionId: string | null;
  mode: SessionMode;
  phase: SessionPhase;
  durationMinutes: number;
  targetSeconds: number;
  elapsed: number;
  startedAt: number;
  status: SessionStatus;
}): Promise<void> {
  try {
    if ((state.status !== 'active' && state.status !== 'paused') || !state.sessionId) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }
    const data: PersistedSession = {
      sessionId: state.sessionId,
      mode: state.mode,
      phase: state.phase,
      durationMinutes: state.durationMinutes,
      targetSeconds: state.targetSeconds,
      elapsed: state.elapsed,
      startedAt: state.startedAt,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // silent
  }
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessionId: null,
  mode: 'reset',
  status: 'idle',
  phase: 'idle',
  durationMinutes: 3,
  completedDurationMinutes: 0,
  targetSeconds: 0,
  elapsed: 0,
  totalRemaining: 0,
  fadeInDuration: FADE_IN_DURATION,
  returnDuration: RETURN_DURATION,
  startedAt: 0,

  setMode: (mode: SessionMode) => {
    set({ mode });
  },

  setDuration: (minutes: number) => {
    set({ durationMinutes: minutes });
  },

  setCompletedDurationMinutes: (minutes: number) => {
    set({ completedDurationMinutes: minutes });
  },

  startSession: (input) => {
    const state = get();
    const nextMode = input?.mode ?? state.mode;
    const durationMinutes = input?.durationMinutes ?? state.durationMinutes;
    const phase =
      input?.phase ??
      (nextMode === 'reset' ? 'fade' : 'active');
    const totalSeconds =
      input?.targetSeconds ??
      (nextMode === 'reset'
        ? durationMinutes * 60 + state.fadeInDuration + state.returnDuration
        : durationMinutes * 60);

    const now = Date.now();
    set({
      mode: nextMode,
      sessionId: createSessionId(),
      status: 'active',
      phase,
      durationMinutes,
      targetSeconds: totalSeconds,
      elapsed: 0,
      totalRemaining: totalSeconds,
      startedAt: now,
    });

    persistSession({
      sessionId: get().sessionId,
      mode: nextMode,
      phase,
      durationMinutes,
      targetSeconds: totalSeconds,
      elapsed: 0,
      startedAt: now,
      status: 'active',
    });

    // Start app blocking (fire-and-forget)
    appBlockingBridge.startBlocking(nextMode).catch(() => undefined);
  },

  tick: (elapsed: number) => {
    const { targetSeconds } = get();
    const remaining = Math.max(0, targetSeconds - elapsed);
    set({ elapsed, totalRemaining: remaining });
  },

  advancePhase: (phase: SessionPhase) => {
    set({ phase });
  },

  pauseSession: () => {
    const { status } = get();
    if (status !== 'active') return;
    set({ status: 'paused' });
  },

  resumeSession: () => {
    const { status } = get();
    if (status !== 'paused') return;
    set({ status: 'active' });
  },

  interruptSession: () => {
    const { status } = get();
    if (status !== 'active' && status !== 'paused') return;
    set({ status: 'interrupted', phase: 'idle' });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    appBlockingBridge.stopBlocking().catch(() => undefined);
  },

  completeSession: () => {
    set({
      status: 'completed',
      phase: 'complete',
      totalRemaining: 0,
    });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    appBlockingBridge.stopBlocking().catch(() => undefined);
  },

  abandonSession: () => {
    set({
      status: 'abandoned',
      phase: 'idle',
      sessionId: null,
      completedDurationMinutes: 0,
      targetSeconds: 0,
      elapsed: 0,
      totalRemaining: 0,
      startedAt: 0,
    });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    appBlockingBridge.stopBlocking().catch(() => undefined);
  },

  resetSession: () => {
    set({
      sessionId: null,
      status: 'idle',
      phase: 'idle',
      completedDurationMinutes: 0,
      targetSeconds: 0,
      elapsed: 0,
      totalRemaining: 0,
      startedAt: 0,
    });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
  },

  hydrateSession: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data: PersistedSession = JSON.parse(raw);
      if (!data.sessionId) return;

      // Recompute elapsed time since session started
      const now = Date.now();
      const realElapsed = Math.floor((now - data.startedAt) / 1000);
      const elapsed = Math.max(data.elapsed, realElapsed);

      // If time has already exceeded target (non-move mode), mark as abandoned
      if (data.mode !== 'move' && elapsed >= data.targetSeconds) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }

      set({
        sessionId: data.sessionId,
        mode: data.mode,
        status: 'active',
        phase: data.phase,
        durationMinutes: data.durationMinutes,
        targetSeconds: data.targetSeconds,
        elapsed,
        totalRemaining: Math.max(0, data.targetSeconds - elapsed),
        startedAt: data.startedAt,
      });
    } catch {
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    }
  },
}));
