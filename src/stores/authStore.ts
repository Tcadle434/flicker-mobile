/**
 * Auth Store
 *
 * Manages authentication state using Zustand
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api/auth';
import type { AuthState, User } from '../types';

const AUTH_HISTORY_STORAGE_KEY = '@flicker:auth_history';

let authListenerBound = false;

async function readHasAuthenticatedBefore(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(AUTH_HISTORY_STORAGE_KEY)) === 'true';
  } catch {
    return false;
  }
}

async function persistHasAuthenticatedBefore(): Promise<void> {
  try {
    await AsyncStorage.setItem(AUTH_HISTORY_STORAGE_KEY, 'true');
  } catch {
    // silent
  }
}

interface AuthStore extends AuthState {
  // Actions
  initialize: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  hasAuthenticatedBefore: false,
  isLoading: true,
  error: null,

  // Initialize auth state (check for existing session)
  initialize: async () => {
    let hasAuthenticatedBefore = false;

    try {
      set({ isLoading: true, error: null });

      hasAuthenticatedBefore = await readHasAuthenticatedBefore();

      if (!authListenerBound) {
        authListenerBound = true;
        authService.onAuthStateChange((authUser) => {
          if (authUser) {
            void persistHasAuthenticatedBefore();
            set({
              user: authUser,
              isAuthenticated: true,
              hasAuthenticatedBefore: true,
              isLoading: false,
              error: null,
            });
            return;
          }

          set((state) => ({
            user: null,
            isAuthenticated: false,
            hasAuthenticatedBefore: state.hasAuthenticatedBefore,
            isLoading: false,
            error: null,
          }));
        });
      }

      // Check for existing session
      const { user, error } = await authService.getSession();

      if (error || !user) {
        set({
          user: null,
          isAuthenticated: false,
          hasAuthenticatedBefore,
          isLoading: false,
          error: error?.message ?? null,
        });
        return;
      }

      await persistHasAuthenticatedBefore();

      set({
        user,
        isAuthenticated: true,
        hasAuthenticatedBefore: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({
        user: null,
        isAuthenticated: false,
        hasAuthenticatedBefore,
        isLoading: false,
        error: (error as Error).message,
      });
    }
  },

  // Sign up a new user
  signUp: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const { user, error } = await authService.signUp(email, password);

      if (error || !user) {
        set({ isLoading: false, error: error?.message || null });
        return { error };
      }

      await persistHasAuthenticatedBefore();

      set({
        user,
        isAuthenticated: true,
        hasAuthenticatedBefore: true,
        isLoading: false,
        error: null,
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      set({ isLoading: false, error: err.message });
      return { error: err };
    }
  },

  // Sign in an existing user
  signIn: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });

      const { user, error } = await authService.signIn(email, password);

      if (error || !user) {
        set({ isLoading: false, error: error?.message || null });
        return { error };
      }

      await persistHasAuthenticatedBefore();

      set({
        user,
        isAuthenticated: true,
        hasAuthenticatedBefore: true,
        isLoading: false,
        error: null,
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      set({ isLoading: false, error: err.message });
      return { error: err };
    }
  },

  signInWithApple: async () => {
    try {
      set({ isLoading: true, error: null });
      const { user, error } = await authService.signInWithApple();
      if (error || !user) {
        set({ isLoading: false, error: error?.message !== 'CANCELED' ? (error?.message ?? null) : null });
        return { error };
      }
      await persistHasAuthenticatedBefore();
      set({ user, isAuthenticated: true, hasAuthenticatedBefore: true, isLoading: false, error: null });
      return { error: null };
    } catch (error) {
      const err = error as Error;
      set({ isLoading: false, error: err.message });
      return { error: err };
    }
  },

  signInWithGoogle: async () => {
    try {
      set({ isLoading: true, error: null });
      const { user, error } = await authService.signInWithGoogle();
      if (error || !user) {
        set({ isLoading: false, error: error?.message !== 'CANCELED' ? (error?.message ?? null) : null });
        return { error };
      }
      await persistHasAuthenticatedBefore();
      set({ user, isAuthenticated: true, hasAuthenticatedBefore: true, isLoading: false, error: null });
      return { error: null };
    } catch (error) {
      const err = error as Error;
      set({ isLoading: false, error: err.message });
      return { error: err };
    }
  },

  // Sign out the current user
  signOut: async () => {
    try {
      set({ isLoading: true, error: null });

      await authService.signOut();

      set((state) => ({
        user: null,
        isAuthenticated: false,
        hasAuthenticatedBefore: state.hasAuthenticatedBefore,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Sign out failed:', error);
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      set({ error: null });
      const { error } = await authService.resetPassword(email);
      if (error) {
        set({ error: error.message });
      }
      return { error };
    } catch (error) {
      const err = error as Error;
      set({ error: err.message });
      return { error: err };
    }
  },

  // Update password
  updatePassword: async (newPassword: string) => {
    try {
      set({ error: null });
      const { error } = await authService.updatePassword(newPassword);
      if (error) {
        set({ error: error.message });
      }
      return { error };
    } catch (error) {
      const err = error as Error;
      set({ error: err.message });
      return { error: err };
    }
  },

  // Set user (for auth state changes)
  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
      hasAuthenticatedBefore: user ? true : get().hasAuthenticatedBefore,
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
