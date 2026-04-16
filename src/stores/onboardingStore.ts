/**
 * Onboarding Store
 *
 * Manages the active onboarding flow.
 * Supabase is the source of truth for finalized onboarding.
 * Paywall acceptance is persisted locally until auth is completed.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/api/supabase';
import type { OnboardingState, OnboardingPreferences } from '../types';

const TOTAL_STEPS = 17;
const STORAGE_KEY = '@flicker:onboarding_gate';

interface OnboardingStore extends OnboardingState {
  totalSteps: number;

  initialize: () => Promise<void>;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  setGoals: (goals: string[]) => void;
  setScreenTime: (value: string, hours: number) => void;
  setBirthDate: (value: string) => void;
  setNoisiest: (value: string) => void;
  setDistraction: (value: string) => void;
  setPermission: (key: keyof OnboardingState['permissionsGranted'], granted: boolean) => void;
  markReviewPromptAttempted: () => void;
  resetReviewPromptAttempted: () => void;
  markPaywallAccepted: () => Promise<void>;
  clearPaywallAccepted: () => Promise<void>;
  finalizeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const INITIAL_PREFERENCES: OnboardingPreferences = {
  goals: [],
  screenTime: '',
  screenTimeHours: 0,
  distraction: '',
  noisiest: '',
  birthDate: '',
};

async function readPersistedGateState(): Promise<{ paywallAccepted: boolean }> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return { paywallAccepted: false };

    const parsed = JSON.parse(raw) as { paywallAccepted?: boolean };
    return { paywallAccepted: parsed.paywallAccepted === true };
  } catch {
    return { paywallAccepted: false };
  }
}

async function persistGateState(paywallAccepted: boolean): Promise<void> {
  try {
    if (!paywallAccepted) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ paywallAccepted: true }));
  } catch {
    // silent
  }
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  completed: false,
  paywallAccepted: false,
  reviewPromptAttemptedThisSession: false,
  currentStep: 0,
  totalSteps: TOTAL_STEPS,
  preferences: { ...INITIAL_PREFERENCES },
  permissionsGranted: {
    notifications: false,
    screenTime: false,
    tracking: false,
  },

  initialize: async () => {
    const persistedGate = await readPersistedGateState();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({
          completed: false,
          paywallAccepted: persistedGate.paywallAccepted,
          reviewPromptAttemptedThisSession: false,
        });
        return;
      }

      const { data } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      const completed = !!data?.onboarding_completed;
      const paywallAccepted = completed ? false : persistedGate.paywallAccepted;

      set({ completed, paywallAccepted, reviewPromptAttemptedThisSession: false });

      if (completed) {
        await persistGateState(false);
      }
    } catch {
      set({
        completed: false,
        paywallAccepted: persistedGate.paywallAccepted,
        reviewPromptAttemptedThisSession: false,
      });
    }
  },

  nextStep: () => {
    const { currentStep } = get();
    if (currentStep < TOTAL_STEPS - 1) {
      set({ currentStep: currentStep + 1 });
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  goToStep: (step) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      set({ currentStep: step });
    }
  },

  setGoals: (goals) => {
    set((s) => ({ preferences: { ...s.preferences, goals } }));
  },

  setScreenTime: (value, hours) => {
    set((s) => ({ preferences: { ...s.preferences, screenTime: value, screenTimeHours: hours } }));
  },

  setBirthDate: (value) => {
    set((s) => ({ preferences: { ...s.preferences, birthDate: value } }));
  },

  setNoisiest: (value) => {
    set((s) => ({ preferences: { ...s.preferences, noisiest: value } }));
  },

  setDistraction: (value) => {
    set((s) => ({ preferences: { ...s.preferences, distraction: value } }));
  },

  setPermission: (key, granted) => {
    set((s) => ({
      permissionsGranted: { ...s.permissionsGranted, [key]: granted },
    }));
  },

  markReviewPromptAttempted: () => {
    set({ reviewPromptAttemptedThisSession: true });
  },

  resetReviewPromptAttempted: () => {
    set({ reviewPromptAttemptedThisSession: false });
  },

  markPaywallAccepted: async () => {
    set({ paywallAccepted: true });
    await persistGateState(true);
  },

  clearPaywallAccepted: async () => {
    set({ paywallAccepted: false });
    await persistGateState(false);
  },

  finalizeOnboarding: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      set({
        completed: true,
        paywallAccepted: false,
        reviewPromptAttemptedThisSession: false,
        currentStep: 0,
      });
      await persistGateState(false);

      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    } catch {
      // silent — local state is already set
    }
  },

  resetOnboarding: async () => {
    set({
      completed: false,
      paywallAccepted: false,
      reviewPromptAttemptedThisSession: false,
      currentStep: 0,
      preferences: { ...INITIAL_PREFERENCES },
      permissionsGranted: { notifications: false, screenTime: false, tracking: false },
    });

    await persistGateState(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ onboarding_completed: false })
          .eq('id', user.id);
      }
    } catch {
      // silent
    }
  },
}));
