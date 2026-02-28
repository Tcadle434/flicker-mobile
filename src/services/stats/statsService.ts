/**
 * Stats Service
 *
 * Queries Supabase session_logs for stats display.
 */

import { supabase } from '../api/supabase';

type SessionMode = 'reset' | 'focus' | 'move';

export interface DayStat {
  date: string; // YYYY-MM-DD
  reset: number; // total seconds
  focus: number;
  move: number;
  lightEarned: number;
}

export interface StatsSummary {
  dailyStats: DayStat[];
  totalSeconds: Record<SessionMode, number>;
  totalSessions: Record<SessionMode, number>;
  totalLight: number;
  streak: number;
}

/**
 * Fetch last 30 days of session stats from Supabase.
 * Only counts completed sessions.
 */
export async function fetchLast30DaysStats(): Promise<StatsSummary> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString();

  const fallback: StatsSummary = {
    dailyStats: [],
    totalSeconds: { reset: 0, focus: 0, move: 0 },
    totalSessions: { reset: 0, focus: 0, move: 0 },
    totalLight: 0,
    streak: 0,
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fallback;

    const { data, error } = await supabase
      .from('session_logs')
      .select('mode, elapsed_seconds, light_earned, created_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('created_at', since)
      .order('created_at', { ascending: true });

    if (error || !data) return fallback;

    // Build daily breakdown
    const dayMap = new Map<string, DayStat>();
    const totals: StatsSummary['totalSeconds'] = { reset: 0, focus: 0, move: 0 };
    const counts: StatsSummary['totalSessions'] = { reset: 0, focus: 0, move: 0 };
    let totalLight = 0;

    for (const row of data) {
      const date = row.created_at.slice(0, 10);
      const mode = row.mode as SessionMode;
      const seconds = row.elapsed_seconds ?? 0;
      const light = row.light_earned ?? 0;

      if (!dayMap.has(date)) {
        dayMap.set(date, { date, reset: 0, focus: 0, move: 0, lightEarned: 0 });
      }
      const day = dayMap.get(date)!;
      day[mode] += seconds;
      day.lightEarned += light;

      totals[mode] += seconds;
      counts[mode]++;
      totalLight += light;
    }

    // Calculate streak (consecutive days with at least one session, ending today or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allDates = new Set(dayMap.keys());

    let streak = 0;
    const checkDate = new Date(today);
    // Allow streak to count from yesterday if no session today yet
    if (!allDates.has(formatDate(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    while (allDates.has(formatDate(checkDate))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
      dailyStats: Array.from(dayMap.values()),
      totalSeconds: totals,
      totalSessions: counts,
      totalLight,
      streak,
    };
  } catch {
    return fallback;
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
