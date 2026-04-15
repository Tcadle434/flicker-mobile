/**
 * Subscription Store
 *
 * Manages RevenueCat entitlement state for the custom paywall flow.
 */

import { create } from 'zustand';
import { paywallService, type EntitlementState } from '../services/subscription/paywallService';
import { useAuthStore } from './authStore';

interface SubscriptionStore {
  isEntitled: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;

  initialize: () => Promise<void>;
  refreshEntitlement: () => Promise<void>;
  presentPaywall: (placement?: string) => Promise<'purchased' | 'restored' | 'dismissed'>;
  restorePurchases: () => Promise<boolean>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  isEntitled: false,
  isTrialActive: false,
  trialDaysRemaining: 0,
  isLoading: false,

  initialize: async () => {
    set({ isLoading: true });
    try {
      await paywallService.syncIdentity(useAuthStore.getState().user?.id ?? null);
      const state = await paywallService.getEntitlementState();
      set({
        isEntitled: state.isEntitled,
        isTrialActive: state.isTrialActive,
        trialDaysRemaining: state.trialDaysRemaining,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  refreshEntitlement: async () => {
    try {
      await paywallService.syncIdentity(useAuthStore.getState().user?.id ?? null);
      const state = await paywallService.getEntitlementState();
      set({
        isEntitled: state.isEntitled,
        isTrialActive: state.isTrialActive,
        trialDaysRemaining: state.trialDaysRemaining,
      });
    } catch {
      // keep current state on failure
    }
  },

  presentPaywall: async (placement = 'default') => {
    return paywallService.presentPaywall(placement);
  },

  restorePurchases: async () => {
    await paywallService.syncIdentity(useAuthStore.getState().user?.id ?? null);
    const state = await paywallService.restorePurchases();
    set({
      isEntitled: state.isEntitled,
      isTrialActive: state.isTrialActive,
      trialDaysRemaining: state.trialDaysRemaining,
    });
    return state.isEntitled;
  },
}));
