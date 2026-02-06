import { create } from 'zustand';
import { logger } from '../lib/logger';

interface StreakStore {
  weeklyMarks: boolean[];
  overallStreak: number;
  totalResets: number;
  lastResetAt: number | null;
  isLoading: boolean;

  fetchStreak: () => Promise<void>;
  recordReset: (duration: number, moodAfter?: string) => Promise<void>;
}

export const useStreakStore = create<StreakStore>((set, get) => ({
  weeklyMarks: [false, false, false, false, false, false, false],
  overallStreak: 0,
  totalResets: 0,
  lastResetAt: null,
  isLoading: false,

  fetchStreak: async () => {
    try {
      set({ isLoading: true });
      // Import dynamically to avoid circular deps
      const { fetchStreakData } = await import('../services/api/streakService');
      const { useAuthStore } = await import('./authStore');
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ isLoading: false });
        return;
      }

      const data = await fetchStreakData(user.id);
      set({
        weeklyMarks: data.weeklyMarks,
        overallStreak: data.overallStreak,
        totalResets: data.totalResets,
        lastResetAt: data.lastResetAt,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch streak data', error);
      // Try local cache fallback
      try {
        const { getLocalStreakCache } = await import('../services/storage/resetStorage');
        const cached = await getLocalStreakCache();
        if (cached) {
          set({
            weeklyMarks: cached.weeklyMarks,
            overallStreak: cached.overallStreak,
            totalResets: cached.totalResets,
            lastResetAt: cached.lastResetAt,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      } catch {
        set({ isLoading: false });
      }
    }
  },

  recordReset: async (duration: number, moodAfter?: string) => {
    try {
      const { recordReset } = await import('../services/api/streakService');
      const { useAuthStore } = await import('./authStore');
      const user = useAuthStore.getState().user;
      if (!user) return;

      await recordReset(user.id, duration, moodAfter);

      // Update local state
      const { setLocalStreakCache } = await import('../services/storage/resetStorage');
      const now = Date.now();
      set({ lastResetAt: now });

      // Refresh full streak data
      await get().fetchStreak();

      // Cache locally
      const state = get();
      await setLocalStreakCache({
        weeklyMarks: state.weeklyMarks,
        overallStreak: state.overallStreak,
        totalResets: state.totalResets,
        lastResetAt: state.lastResetAt,
      });
    } catch (error) {
      logger.error('Failed to record reset', error);
    }
  },
}));
