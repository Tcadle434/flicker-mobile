/**
 * Authentication Service
 *
 * Handles user authentication operations using Supabase
 */

import { supabase } from './supabase';
import type { User } from '../../types';

export class AuthService {
  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { user: null, error: new Error(error.message) };
      }

      if (!data.user) {
        return { user: null, error: new Error('Failed to create user') };
      }

      // Create user profile in database
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          is_premium: false,
          subscription_status: 'free',
        });

      if (profileError) {
        console.error('Failed to create user profile:', profileError.message, profileError);
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        createdAt: data.user.created_at,
        isPremium: false,
        subscriptionStatus: 'free',
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign in an existing user with email and password
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: new Error(error.message) };
      }

      if (!data.user) {
        return { user: null, error: new Error('Failed to sign in') };
      }

      // Fetch user profile from database
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        createdAt: data.user.created_at,
        isPremium: profileData?.is_premium ?? false,
        subscriptionStatus: (profileData?.subscription_status as any) ?? 'free',
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Get the current session
   */
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        return { user: null, error: error ? new Error(error.message) : null };
      }

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single();

      const user: User = {
        id: data.session.user.id,
        email: data.session.user.email!,
        createdAt: data.session.user.created_at,
        isPremium: profileData?.is_premium ?? false,
        subscriptionStatus: (profileData?.subscription_status as any) ?? 'free',
      };

      return { user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  /**
   * Send a password reset email
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch user profile
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        const user: User = {
          id: session.user.id,
          email: session.user.email!,
          createdAt: session.user.created_at,
          isPremium: profileData?.is_premium ?? false,
          subscriptionStatus: (profileData?.subscription_status as any) ?? 'free',
        };

        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
