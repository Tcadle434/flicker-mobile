import { create } from 'zustand';
import { getLastResetAt } from '../services/storage/resetStorage';
import type { MoodState } from '../constants/moodThemes';
import { scheduleMoodNudge, cancelMoodNudge } from '../services/notifications/notificationService';

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

export const useMoodStore = create<MoodStore>((set, get) => {
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

      // Schedule or cancel mood nudge notifications
      if (lastResetAt) {
        const hoursSince = (Date.now() - lastResetAt) / 3_600_000;
        if (currentMood === 'calm') {
          // Approaching neutral at 12 hours
          const hoursUntilShift = 12 - hoursSince;
          if (hoursUntilShift > 0) {
            scheduleMoodNudge(hoursUntilShift, 'neutral');
          }
        } else if (currentMood === 'neutral') {
          // Approaching overwhelmed at 24 hours
          const hoursUntilShift = 24 - hoursSince;
          if (hoursUntilShift > 0) {
            scheduleMoodNudge(hoursUntilShift, 'overwhelmed');
          }
        } else {
          cancelMoodNudge();
        }
      }
    },
  };
});
