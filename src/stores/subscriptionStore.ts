/**
 * Subscription Store
 *
 * Manages subscription state and offerings using Zustand
 * Note: RevenueCat stripped — will be replaced with Superwall later
 */

import { create } from 'zustand';
import { paywallService } from '../services/subscription/paywallService';
import type { SubscriptionStatus } from '../types';

interface SubscriptionStore {
  // State
  isPremium: boolean;
  subscriptionStatus: SubscriptionStatus;
  offerings: any[];
  isLoading: boolean;
  error: Error | null;
  paywallVisible: boolean;

  // Actions
  initialize: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  purchasePackage: (packageToPurchase: any) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  checkSubscriptionStatus: () => Promise<void>;
  showPaywall: () => void;
  hidePaywall: () => void;
  shouldShowPaywall: () => Promise<boolean>;
  markPaywallShown: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  // Initial state
  isPremium: false,
  subscriptionStatus: 'free',
  offerings: [],
  isLoading: false,
  error: null,
  paywallVisible: false,

  // Initialize subscription state
  initialize: async () => {
    // No-op until Superwall is integrated
    set({ isLoading: false, isPremium: false, subscriptionStatus: 'free' });
  },

  // Fetch available offerings
  fetchOfferings: async () => {
    // No-op until Superwall is integrated
    set({ offerings: [] });
  },

  // Purchase a package
  purchasePackage: async (_packageToPurchase: any) => {
    // No-op until Superwall is integrated
    return false;
  },

  // Restore previous purchases
  restorePurchases: async () => {
    // No-op until Superwall is integrated
    return false;
  },

  // Check current subscription status
  checkSubscriptionStatus: async () => {
    // No-op until Superwall is integrated
    set({ isPremium: false, subscriptionStatus: 'free' });
  },

  // Show paywall
  showPaywall: () => {
    set({ paywallVisible: true });
  },

  // Hide paywall
  hidePaywall: () => {
    set({ paywallVisible: false });
  },

  // Check if paywall should be shown
  shouldShowPaywall: async () => {
    const { isPremium } = get();
    return await paywallService.shouldShowPaywall(isPremium);
  },

  // Mark paywall as shown
  markPaywallShown: async () => {
    await paywallService.markPaywallShown();
  },
}));
