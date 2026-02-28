import { create } from 'zustand';
import { logger } from '../lib/logger';

interface StreakStore {
  weeklyMarks: boolean[];
  overallStreak: number;
  totalSessions: number;
  lastSessionAt: number | null;
  isLoading: boolean;

  fetchStreak: () => Promise<void>;
}

export const useStreakStore = create<StreakStore>((set) => ({
  weeklyMarks: [false, false, false, false, false, false, false],
  overallStreak: 0,
  totalSessions: 0,
  lastSessionAt: null,
  isLoading: false,

  fetchStreak: async () => {
    try {
      set({ isLoading: true });
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
        totalSessions: data.totalSessions,
        lastSessionAt: data.lastSessionAt,
        isLoading: false,
      });
    } catch (error) {
      logger.error('Failed to fetch streak data', error);
      set({ isLoading: false });
    }
  },
}));
