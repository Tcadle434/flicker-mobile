import { supabase } from './supabase';
import { logger } from '../../lib/logger';
import type { WeeklyStreak } from '../../types';

/**
 * Fetch streak data for a user.
 * All completed sessions (reset, focus, move) count toward the streak.
 * Weekly marks use device timezone to determine Monday start.
 * Streak walks dates backwards from today.
 */
export async function fetchStreakData(userId: string): Promise<WeeklyStreak> {
  const { data, error } = await supabase
    .from('session_logs')
    .select('created_at')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    logger.error('Failed to fetch session logs for streak', error);
    throw error;
  }

  const rows = data ?? [];
  const totalSessions = rows.length;
  const lastSessionAt = rows.length > 0 ? new Date(rows[0].created_at).getTime() : null;

  // Build a set of date strings (YYYY-MM-DD in local timezone) that have sessions
  const sessionDates = new Set<string>();
  for (const row of rows) {
    const d = new Date(row.created_at);
    sessionDates.add(formatLocalDate(d));
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
    weeklyMarks.push(sessionDates.has(formatLocalDate(d)));
  }

  // Consecutive-day streak walking backwards from today
  let overallStreak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  while (sessionDates.has(formatLocalDate(cursor))) {
    overallStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { weeklyMarks, overallStreak, totalSessions, lastSessionAt };
}

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
