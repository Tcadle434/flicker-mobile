/**
 * Onboarding Store
 *
 * Manages the 10-screen onboarding flow:
 * step progression, personalization preferences, and permissions.
 *
 * Completion flag is synced to Supabase users.onboarding_completed
 * so it survives app reinstalls.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/api/supabase';
import type { OnboardingState, OnboardingPreferences } from '../types';

const STORAGE_KEY = '@flicker:onboarding';
const TOTAL_STEPS = 10;

interface OnboardingStore extends OnboardingState {
  totalSteps: number;

  initialize: () => Promise<void>;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  setGoals: (goals: string[]) => void;
  setScreenTime: (value: string) => void;
  setDistraction: (value: string) => void;
  setPermission: (key: keyof OnboardingState['permissionsGranted'], granted: boolean) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const INITIAL_PREFERENCES: OnboardingPreferences = {
  goals: [],
  screenTime: '',
  distraction: '',
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  completed: false,
  currentStep: 0,
  totalSteps: TOTAL_STEPS,
  preferences: { ...INITIAL_PREFERENCES },
  permissionsGranted: {
    notifications: false,
    screenTime: false,
  },

  initialize: async () => {
    // 1. Load local state (preferences, step, etc.)
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          completed: data.completed ?? false,
          currentStep: data.currentStep ?? 0,
          preferences: data.preferences ?? { ...INITIAL_PREFERENCES },
          permissionsGranted: data.permissionsGranted ?? {
            notifications: false,
            screenTime: false,
          },
        });
      }
    } catch {
      // ignore corrupt data
    }

    // 2. Check Supabase for onboarding_completed flag (survives reinstalls)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (data?.onboarding_completed && !get().completed) {
        // DB says completed but local doesn't — trust the DB
        set({ completed: true });
        // Persist locally so we don't need to check again
        const state = get();
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
          completed: true,
          currentStep: state.currentStep,
          preferences: state.preferences,
          permissionsGranted: state.permissionsGranted,
        })).catch(() => undefined);
      }
    } catch {
      // offline — fall back to local state
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

  setScreenTime: (value) => {
    set((s) => ({ preferences: { ...s.preferences, screenTime: value } }));
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
    const state = get();
    const newState = {
      completed: true,
      currentStep: state.currentStep,
      preferences: state.preferences,
      permissionsGranted: state.permissionsGranted,
    };
    set({ completed: true });

    // Persist locally
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch {
      // silent
    }

    // Persist to Supabase (survives reinstalls)
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
      permissionsGranted: { notifications: false, screenTime: false },
    });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // silent
    }
  },
}));
