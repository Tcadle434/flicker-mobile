import { create } from 'zustand';
import { syncCurrencyTransaction } from '../services/api/currencyService';
import { supabase } from '../services/api/supabase';
import { buildStreakRewardSummary } from '../services/rewards/rewardMath';

type SessionMode = 'reset' | 'focus' | 'move';

interface CurrencyStore {
  balance: number;
  lifetimeEarned: number;
  claimedSessionIds: Record<string, boolean>;
  awardedSessionAmounts: Record<string, number>;
  hydratedUserId: string | null;
  isHydrated: boolean;
  isHydrating: boolean;

  hydrate: () => Promise<void>;
  resetForAuthChange: () => void;
  awardSessionCompletion: (input: {
    sessionId: string;
    mode: SessionMode;
    durationMinutes: number;
  }) => Promise<{ awarded: boolean; amount: number }>;
  spend: (amount: number, itemId: string, source?: string) => Promise<boolean>;
}

function buildTxId(sessionId: string): string {
  return `tx_${sessionId}_${Date.now()}`;
}

function normalizeMinutes(durationMinutes: number): number {
  if (!Number.isFinite(durationMinutes)) return 1;
  return Math.max(1, Math.round(durationMinutes));
}

async function getUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

function createCurrencyDefaults() {
  return {
    balance: 0,
    lifetimeEarned: 0,
    claimedSessionIds: {},
    awardedSessionAmounts: {},
    hydratedUserId: null,
    isHydrated: false,
    isHydrating: false,
  };
}

export const useCurrencyStore = create<CurrencyStore>((set, get) => ({
  ...createCurrencyDefaults(),

  hydrate: async () => {
    if (get().isHydrating) return;

    const userId = await getUserId();
    if (userId && get().isHydrated && get().hydratedUserId === userId) {
      return;
    }

    set({ isHydrating: true });

    try {
      if (!userId) {
        get().resetForAuthChange();
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('light_balance, lifetime_earned')
        .eq('id', userId)
        .single();

      if (!error && data) {
        set({
          balance: data.light_balance ?? 0,
          lifetimeEarned: data.lifetime_earned ?? 0,
          hydratedUserId: userId,
          isHydrated: true,
        });
      } else {
        set({
          balance: 0,
          lifetimeEarned: 0,
        });
      }
    } finally {
      set({ isHydrating: false });
    }
  },

  resetForAuthChange: () => set({
    ...createCurrencyDefaults(),
  }),

  awardSessionCompletion: async ({ sessionId, mode, durationMinutes }) => {
    if (!sessionId) return { awarded: false, amount: 0 };

    const state = get();
    if (state.claimedSessionIds[sessionId]) {
      return {
        awarded: false,
        amount: state.awardedSessionAmounts[sessionId] ?? 0,
      };
    }

    const minutes = normalizeMinutes(durationMinutes);

    // Get streak from streakStore (avoid circular import via getState)
    let streakDays = 0;
    try {
      const { useStreakStore } = await import('./streakStore');
      const streakStore = useStreakStore.getState();
      if (!streakStore.hasLoaded) {
        await streakStore.fetchStreak();
      }
      streakDays = useStreakStore.getState().overallStreak;
    } catch {
      // fallback: no streak bonus
    }

    const rewardSummary = buildStreakRewardSummary(streakDays);
    const amount = Math.round(rewardSummary.effectiveRatesPerMinute[mode] * minutes);

    const txId = buildTxId(sessionId);

    // Optimistic local update
    set({
      balance: state.balance + amount,
      lifetimeEarned: state.lifetimeEarned + amount,
      claimedSessionIds: {
        ...state.claimedSessionIds,
        [sessionId]: true,
      },
      awardedSessionAmounts: {
        ...state.awardedSessionAmounts,
        [sessionId]: amount,
      },
    });

    // Write to Supabase (primary path — DB trigger updates users.light_balance)
    syncCurrencyTransaction({
      id: txId,
      sessionId,
      amount,
      type: 'earn',
      source: 'session_complete',
    }).then((ok) => {
      if (!ok) console.warn('[currency] Failed to sync earn transaction', txId);
    }).catch((err) => {
      console.warn('[currency] Error syncing earn transaction', err);
    });

    return { awarded: true, amount };
  },

  spend: async (amount, itemId, source = 'sanctuary_purchase') => {
    const state = get();
    if (state.balance < amount) return false;

    const txId = `tx_spend_${itemId}_${Date.now()}`;

    // Optimistic local update
    set({ balance: state.balance - amount });

    // Write to Supabase (primary path — DB trigger updates users.light_balance)
    syncCurrencyTransaction({
      id: txId,
      amount: -amount,
      type: 'spend',
      source,
    }).then((ok) => {
      if (!ok) console.warn('[currency] Failed to sync spend transaction', txId);
    }).catch((err) => {
      console.warn('[currency] Error syncing spend transaction', err);
    });

    return true;
  },
}));
