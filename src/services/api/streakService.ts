import { supabase } from './supabase';
import { logger } from '../../lib/logger';
import type { WeeklyStreak } from '../../types';

/**
 * Fetch streak data for a user.
 * Weekly marks use device timezone to determine Monday start.
 * Streak walks dates backwards from today.
 */
export async function fetchStreakData(userId: string): Promise<WeeklyStreak> {
  const { data, error } = await supabase
    .from('resets')
    .select('completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(200);

  if (error) {
    logger.error('Failed to fetch resets', error);
    throw error;
  }

  const rows = data ?? [];
  const totalResets = rows.length;
  const lastResetAt = rows.length > 0 ? new Date(rows[0].completed_at).getTime() : null;

  // Build a set of date strings (YYYY-MM-DD in local timezone) that have resets
  const resetDates = new Set<string>();
  for (const row of rows) {
    const d = new Date(row.completed_at);
    resetDates.add(formatLocalDate(d));
  }

  // Weekly marks: Monday = index 0, Sunday = index 6
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const weeklyMarks: boolean[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weeklyMarks.push(resetDates.has(formatLocalDate(d)));
  }

  // Consecutive-day streak walking backwards from today
  let overallStreak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  while (resetDates.has(formatLocalDate(cursor))) {
    overallStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { weeklyMarks, overallStreak, totalResets, lastResetAt };
}

/**
 * Record a completed reset session.
 */
export async function recordReset(
  userId: string,
  durationMinutes: number,
  moodAfter?: string,
): Promise<void> {
  const { error } = await supabase.from('resets').insert({
    user_id: userId,
    duration_minutes: Math.max(1, Math.round(durationMinutes)),
    mood_after: moodAfter ?? null,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    logger.error('Failed to record reset', error);
    throw error;
  }
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
