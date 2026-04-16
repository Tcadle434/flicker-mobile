import { create } from 'zustand';
import { logger } from '../lib/logger';

interface StreakStore {
  weeklyMarks: boolean[];
  overallStreak: number;
  totalSessions: number;
  lastSessionAt: number | null;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;

  fetchStreak: (options?: { force?: boolean }) => Promise<void>;
  resetForAuthChange: () => void;
}

const STREAK_DEFAULTS = {
  weeklyMarks: [false, false, false, false, false, false, false],
  overallStreak: 0,
  totalSessions: 0,
  lastSessionAt: null,
  isLoading: false,
  hasLoaded: false,
  error: null,
} satisfies Omit<StreakStore, 'fetchStreak' | 'resetForAuthChange'>;

let inFlightFetch: Promise<void> | null = null;

export const useStreakStore = create<StreakStore>((set, get) => ({
  ...STREAK_DEFAULTS,

  fetchStreak: async (options) => {
    const { force = false } = options ?? {};

    if (inFlightFetch) {
      return inFlightFetch;
    }

    if (!force && (get().isLoading || get().hasLoaded)) {
      return;
    }

    inFlightFetch = (async () => {
      try {
        set({ isLoading: true, error: null });
        const { fetchStreakData } = await import('../services/api/streakService');
        const { useAuthStore } = await import('./authStore');
        const user = useAuthStore.getState().user;

        if (!user) {
          set({ ...STREAK_DEFAULTS });
          return;
        }

        const data = await fetchStreakData(user.id);
        set({
          weeklyMarks: data.weeklyMarks,
          overallStreak: data.overallStreak,
          totalSessions: data.totalSessions,
          lastSessionAt: data.lastSessionAt,
          isLoading: false,
          hasLoaded: true,
          error: null,
        });
      } catch (error) {
        logger.error('Failed to fetch streak data', error);
        set({
          isLoading: false,
          hasLoaded: get().hasLoaded,
          error: error instanceof Error ? error.message : 'Failed to fetch streak data',
        });
      } finally {
        inFlightFetch = null;
      }
    })();

    return inFlightFetch;
  },

  resetForAuthChange: () => {
    inFlightFetch = null;
    set({ ...STREAK_DEFAULTS });
  },
}));
