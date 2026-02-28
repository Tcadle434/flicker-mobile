/**
 * Session Log Service
 *
 * Logs completed and abandoned sessions to Supabase.
 * All calls are best-effort — failures are silent to avoid disrupting the session flow.
 */

import { supabase } from './supabase';
import { logger } from '../../lib/logger';

interface SessionLogInput {
  sessionId: string;
  mode: 'reset' | 'focus' | 'move';
  targetSeconds: number;
  elapsedSeconds: number;
  status: 'completed' | 'abandoned';
  lightEarned: number;
  activityTag?: string | null;

}

/**
 * Log a session to Supabase. Best-effort — never throws.
 */
export async function logSession(input: SessionLogInput): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload: Record<string, unknown> = {
      id: input.sessionId,
      user_id: user.id,
      mode: input.mode,
      target_seconds: Math.round(input.targetSeconds),
      elapsed_seconds: Math.round(input.elapsedSeconds),
      status: input.status,
      light_earned: Math.round(input.lightEarned),
      activity_tag: input.activityTag ?? null,
    };

    const { error } = await supabase.from('session_logs').upsert(payload, { onConflict: 'id' });
    if (error) {
      logger.error('Failed to log session', error);
    }
  } catch (err) {
    logger.error('logSession unexpected error', err);
  }
}
