/**
 * Onboarding Store
 *
 * Manages the 26-screen onboarding flow.
 * Supabase is the single source of truth for completion.
 * Step progression + preferences are in-memory only (reset on app restart).
 */

import { create } from 'zustand';
import { supabase } from '../services/api/supabase';
import type { OnboardingState, OnboardingPreferences } from '../types';

const TOTAL_STEPS = 32;

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
  completeOnboarding: () => Promise<void>;
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

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  completed: false,
  currentStep: 0,
  totalSteps: TOTAL_STEPS,
  preferences: { ...INITIAL_PREFERENCES },
  permissionsGranted: {
    notifications: false,
    screenTime: false,
    tracking: false,
  },

  initialize: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      set({ completed: !!data?.onboarding_completed });
    } catch {
      // offline — default to false
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

  completeOnboarding: async () => {
    set({ completed: true });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('users')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
    } catch {
      // silent — local state is already set
    }
  },

  resetOnboarding: async () => {
    set({
      completed: false,
      currentStep: 0,
      preferences: { ...INITIAL_PREFERENCES },
      permissionsGranted: { notifications: false, screenTime: false, tracking: false },
    });

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
