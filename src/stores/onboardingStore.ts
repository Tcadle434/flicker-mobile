/**
 * Onboarding Store
 *
 * Manages onboarding state and progress using Zustand
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OnboardingState } from '../types';

const STORAGE_KEY = '@sona:onboarding';

interface OnboardingStore extends OnboardingState {
  // Actions
  initialize: () => Promise<void>;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  setPermission: (permission: keyof OnboardingState['permissionsGranted'], granted: boolean) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  // Initial state
  completed: false,
  currentStep: 0,
  permissionsGranted: {
    notifications: false,
    location: false,
    health: false,
  },

  // Initialize from storage
  initialize: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state = JSON.parse(stored);
        set(state);
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    }
  },

  // Set current step
  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  // Move to next step
  nextStep: () => {
    set((state) => ({ currentStep: state.currentStep + 1 }));
  },

  // Move to previous step
  previousStep: () => {
    set((state) => ({
      currentStep: Math.max(0, state.currentStep - 1),
    }));
  },

  // Set permission granted status
  setPermission: (permission, granted) => {
    set((state) => ({
      permissionsGranted: {
        ...state.permissionsGranted,
        [permission]: granted,
      },
    }));
  },

  // Complete onboarding
  completeOnboarding: async () => {
    const newState = { ...get(), completed: true };
    set({ completed: true });

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  },

  // Reset onboarding (for testing)
  resetOnboarding: async () => {
    const initialState = {
      completed: false,
      currentStep: 0,
      permissionsGranted: {
        notifications: false,
        location: false,
        health: false,
      },
    };
    set(initialState);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset onboarding state:', error);
    }
  },
}));
