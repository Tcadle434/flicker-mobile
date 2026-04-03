/**
 * Currency Service
 *
 * Supabase is the source of truth for light balance.
 * Transactions are written to currency_transactions, and a DB trigger
 * updates users.light_balance + users.lifetime_earned.
 */

import { supabase } from './supabase';

interface CurrencyTransactionInput {
  id: string;
  sessionId?: string;
  amount: number;
  type: 'earn' | 'spend';
  source: string;
}

/**
 * Fetch the user's current light balance and lifetime earned from Supabase.
 * Returns null if not authenticated or on error.
 */
export async function fetchBalance(): Promise<{
  lightBalance: number;
  lifetimeEarned: number;
} | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('light_balance, lifetime_earned')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;

    return {
      lightBalance: data.light_balance ?? 0,
      lifetimeEarned: data.lifetime_earned ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Sync a currency transaction to Supabase.
 * This is the primary write path — the DB trigger updates the balance.
 * Returns true on success, false on failure.
 */
export async function syncCurrencyTransaction(
  input: CurrencyTransactionInput,
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from('currency_transactions').insert({
      id: input.id,
      user_id: user.id,
      session_id: input.sessionId ?? null,
      amount: input.amount,
      type: input.type,
      source: input.source,
    });

    return !error;
  } catch {
    return false;
  }
}
