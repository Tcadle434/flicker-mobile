import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeeklyStreak } from '../../types';

const LAST_RESET_KEY = '@sona:last_reset_at';
const STREAK_CACHE_KEY = '@sona:streak_cache';

export async function getLastResetAt(): Promise<number | null> {
  try {
    const value = await AsyncStorage.getItem(LAST_RESET_KEY);
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function setLastResetAt(timestamp: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_RESET_KEY, String(timestamp));
  } catch {
    // ignore storage failures
  }
}

export async function getLocalStreakCache(): Promise<WeeklyStreak | null> {
  try {
    const value = await AsyncStorage.getItem(STREAK_CACHE_KEY);
    if (!value) return null;
    return JSON.parse(value) as WeeklyStreak;
  } catch {
    return null;
  }
}

export async function setLocalStreakCache(data: WeeklyStreak): Promise<void> {
  try {
    await AsyncStorage.setItem(STREAK_CACHE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage failures
  }
}
