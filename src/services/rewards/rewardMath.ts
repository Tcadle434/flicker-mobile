import { config } from '../../constants/config';

type SessionMode = 'reset' | 'focus' | 'move';

export interface StreakRewardSummary {
  streakDays: number;
  streakMultiplier: number;
  streakBonusPercent: number;
  effectiveRatesPerMinute: Record<SessionMode, number>;
}

export function calculateStreakMultiplier(streakDays: number): number {
  const cappedStreak = Math.max(0, Math.min(streakDays, config.rewards.streakBonusCap));
  return 1 + cappedStreak * config.rewards.streakBonusPerDay;
}

export function calculateStreakBonusPercent(streakDays: number): number {
  return Math.round((calculateStreakMultiplier(streakDays) - 1) * 100);
}

export function buildStreakRewardSummary(streakDays: number): StreakRewardSummary {
  const streakMultiplier = calculateStreakMultiplier(streakDays);

  return {
    streakDays,
    streakMultiplier,
    streakBonusPercent: calculateStreakBonusPercent(streakDays),
    effectiveRatesPerMinute: {
      reset: config.rewards.ratesPerMinute.reset * streakMultiplier,
      focus: config.rewards.ratesPerMinute.focus * streakMultiplier,
      move: config.rewards.ratesPerMinute.move * streakMultiplier,
    },
  };
}
