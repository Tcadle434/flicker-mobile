import { create } from 'zustand';
import { AppState } from 'react-native';
import { getLastResetAt } from '../services/storage/resetStorage';
import type { MoodState } from '../constants/moodThemes';

interface MoodStore {
  currentMood: MoodState;
  lastResetAt: number | null;
  computeMood: () => MoodState;
  refreshMood: () => Promise<void>;
}

function computeMoodFromTimestamp(lastResetAt: number | null): MoodState {
  if (!lastResetAt) return 'overwhelmed';
  const hoursSince = (Date.now() - lastResetAt) / 3_600_000;
  if (hoursSince < 12) return 'calm';
  if (hoursSince < 24) return 'neutral';
  return 'overwhelmed';
}

let refreshInterval: ReturnType<typeof setInterval> | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

export const useMoodStore = create<MoodStore>((set, get) => {
  // Start 60-second refresh interval
  const startRefreshLoop = () => {
    if (refreshInterval) return;
    refreshInterval = setInterval(() => {
      const { lastResetAt } = get();
      set({ currentMood: computeMoodFromTimestamp(lastResetAt) });
    }, 60_000);
  };

  // Listen for app foreground to recompute
  if (!appStateSubscription) {
    appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        const { lastResetAt } = get();
        set({ currentMood: computeMoodFromTimestamp(lastResetAt) });
      }
    });
  }

  startRefreshLoop();

  return {
    currentMood: 'overwhelmed',
    lastResetAt: null,

    computeMood: () => {
      const { lastResetAt } = get();
      return computeMoodFromTimestamp(lastResetAt);
    },

    refreshMood: async () => {
      const lastResetAt = await getLastResetAt();
      const currentMood = computeMoodFromTimestamp(lastResetAt);
      set({ lastResetAt, currentMood });
    },
  };
});
