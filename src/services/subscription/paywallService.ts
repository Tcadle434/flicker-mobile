/**
 * Paywall Service — Superwall
 *
 * Flicker uses a hard paywall with 7-day free trial.
 * Superwall handles paywall presentation, purchase flows, and entitlement checks.
 * Development default: entitled = true (override via __DEV__ flag).
 *
 * Trial start timestamp stored in Supabase users.trial_started_at.
 */

import { supabase } from '../api/supabase';
import { config } from '../../constants/config';

export interface EntitlementState {
  isEntitled: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
}

type SuperwallStatus = { status?: string };
type SuperwallModule = {
  configure: (input: { apiKey: string }) => Promise<void>;
  shared: {
    getSubscriptionStatus: () => Promise<SuperwallStatus>;
    register: (input: { placement: string }) => Promise<void>;
  };
};

let cachedSuperwall: SuperwallModule | null | undefined;
let superwallUnavailableWarned = false;

function getSuperwallModule(): SuperwallModule | null {
  if (cachedSuperwall !== undefined) return cachedSuperwall;

  try {
    // Lazy require so missing native linkage doesn't crash the whole app at import time.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
    const imported = require('@superwall/react-native-superwall');
    cachedSuperwall = (imported?.default ?? imported) as SuperwallModule;
    return cachedSuperwall;
  } catch (error) {
    cachedSuperwall = null;
    if (!superwallUnavailableWarned) {
      superwallUnavailableWarned = true;
      console.warn('[PaywallService] Superwall native module unavailable; using dev fallback');
    }
    return null;
  }
}

class PaywallService {
  private initialized = false;

  /**
   * Initialize Superwall SDK. Must be called once at app boot.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const apiKey = config.subscription.superwallApiKey;
      if (!apiKey) {
        console.warn('[PaywallService] No Superwall API key configured — running in dev mode');
        return;
      }

      const superwall = getSuperwallModule();
      if (!superwall) return;

      await superwall.configure({ apiKey });
      this.initialized = true;
    } catch (error) {
      console.error('[PaywallService] Superwall init error:', error);
    }
  }

  /**
   * Check entitlement state.
   * Queries Superwall subscription status.
   * In development (no API key): always entitled.
   */
  async getEntitlementState(): Promise<EntitlementState> {
    if (!this.initialized) {
      // Dev mode fallback — always entitled
      return { isEntitled: true, isTrialActive: false, trialDaysRemaining: 0 };
    }

    try {
      const superwall = getSuperwallModule();
      if (!superwall) {
        return { isEntitled: true, isTrialActive: false, trialDaysRemaining: 0 };
      }

      const status = await superwall.shared.getSubscriptionStatus();
      const isActive = status?.status === 'ACTIVE';

      // Calculate trial state from Supabase
      let isTrialActive = false;
      let trialDaysRemaining = 0;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('trial_started_at')
          .eq('id', user.id)
          .single();

        if (data?.trial_started_at) {
          const startMs = new Date(data.trial_started_at).getTime();
          const elapsed = Date.now() - startMs;
          const elapsedDays = elapsed / (1000 * 60 * 60 * 24);
          const trialDays = config.subscription.trialDays;

          if (elapsedDays < trialDays) {
            isTrialActive = true;
            trialDaysRemaining = Math.ceil(trialDays - elapsedDays);
          }
        }
      }

      return {
        isEntitled: isActive || isTrialActive,
        isTrialActive,
        trialDaysRemaining,
      };
    } catch (error) {
      console.error('[PaywallService] getEntitlementState error:', error);
      // Fail open in case of error to avoid locking users out
      return { isEntitled: true, isTrialActive: false, trialDaysRemaining: 0 };
    }
  }

  /**
   * Present the Superwall paywall for a given placement.
   * Superwall handles all UI, purchase, and restore logic.
   */
  async presentPaywall(placement: string = 'default'): Promise<'purchased' | 'restored' | 'dismissed'> {
    if (!this.initialized) {
      console.warn('[PaywallService] Superwall not initialized — skipping paywall');
      return 'dismissed';
    }

    try {
      const superwall = getSuperwallModule();
      if (!superwall) return 'dismissed';

      await superwall.shared.register({ placement });

      // Superwall register resolves when paywall is dismissed
      // Check subscription status after to determine outcome
      const status = await superwall.shared.getSubscriptionStatus();
      if (status?.status === 'ACTIVE') {
        return 'purchased';
      }
      return 'dismissed';
    } catch (error) {
      console.error('[PaywallService] presentPaywall error:', error);
      return 'dismissed';
    }
  }

  /**
   * Restore purchases.
   */
  async restorePurchases(): Promise<boolean> {
    if (!this.initialized) {
      console.warn('[PaywallService] Superwall not initialized — cannot restore');
      return false;
    }

    try {
      const superwall = getSuperwallModule();
      if (!superwall) return false;
      const status = await superwall.shared.getSubscriptionStatus();
      return status?.status === 'ACTIVE';
    } catch (error) {
      console.error('[PaywallService] restorePurchases error:', error);
      return false;
    }
  }

  /**
   * Start the free trial. Records trial start timestamp in Supabase.
   */
  async startTrial(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('trial_started_at')
        .eq('id', user.id)
        .single();

      // Only set if not already started
      if (!data?.trial_started_at) {
        await supabase
          .from('users')
          .update({ trial_started_at: new Date().toISOString() })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('[PaywallService] startTrial error:', error);
    }
  }
}

export const paywallService = new PaywallService();
