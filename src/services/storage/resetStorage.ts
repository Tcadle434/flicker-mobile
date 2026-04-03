/**
 * Reset Storage
 *
 * Reads the last reset completion timestamp from session_logs.
 * Used by moodStore to compute mood state (reset-specific).
 */

import { supabase } from '../api/supabase';

/**
 * Get the most recent completed reset session timestamp from session_logs.
 */
export async function getLastResetAt(): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('session_logs')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('mode', 'reset')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return new Date(data.created_at).getTime();
  } catch {
    return null;
  }
}
