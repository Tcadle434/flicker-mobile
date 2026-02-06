import { create } from 'zustand';

export type SessionPhase = 'idle' | 'fade' | 'still' | 'return' | 'complete';

const FADE_IN_DURATION = 15;
const RETURN_DURATION = 25;

interface SessionStore {
  phase: SessionPhase;
  durationMinutes: number;
  elapsed: number;
  totalRemaining: number;
  fadeInDuration: number;
  returnDuration: number;

  setDuration: (minutes: number) => void;
  startSession: () => void;
  tick: (elapsed: number) => void;
  advancePhase: (phase: SessionPhase) => void;
  endSession: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  phase: 'idle',
  durationMinutes: 3,
  elapsed: 0,
  totalRemaining: 0,
  fadeInDuration: FADE_IN_DURATION,
  returnDuration: RETURN_DURATION,

  setDuration: (minutes: number) => {
    set({ durationMinutes: minutes });
  },

  startSession: () => {
    const { durationMinutes, fadeInDuration, returnDuration } = get();
    const totalSeconds = durationMinutes * 60 + fadeInDuration + returnDuration;
    set({
      phase: 'fade',
      elapsed: 0,
      totalRemaining: totalSeconds,
    });
  },

  tick: (elapsed: number) => {
    const { durationMinutes, fadeInDuration, returnDuration } = get();
    const totalSeconds = durationMinutes * 60 + fadeInDuration + returnDuration;
    const remaining = Math.max(0, totalSeconds - elapsed);
    set({ elapsed, totalRemaining: remaining });
  },

  advancePhase: (phase: SessionPhase) => {
    set({ phase });
  },

  endSession: () => {
    set({
      phase: 'complete',
      totalRemaining: 0,
    });
  },
}));
