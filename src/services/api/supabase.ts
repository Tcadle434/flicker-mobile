/**
 * Supabase Client Configuration
 *
 * Handles authentication, database access, and analytics
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../../constants/config';

// Initialize Supabase client
export const supabase = createClient(
  config.api.supabaseUrl,
  config.api.supabaseAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Database types (will be auto-generated from Supabase schema)
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          is_premium: boolean;
          subscription_status: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          is_premium?: boolean;
          subscription_status?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          is_premium?: boolean;
          subscription_status?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string;
          mode: string;
          duration: number;
          created_at: string;
          adaptive_inputs_used: string[];
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: string;
          duration: number;
          created_at?: string;
          adaptive_inputs_used?: string[];
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: string;
          duration?: number;
          created_at?: string;
          adaptive_inputs_used?: string[];
        };
      };
      resets: {
        Row: {
          id: string;
          user_id: string;
          completed_at: string;
          duration_minutes: number;
          mood_after: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          completed_at?: string;
          duration_minutes: number;
          mood_after?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          completed_at?: string;
          duration_minutes?: number;
          mood_after?: string | null;
          created_at?: string;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          audio_quality: string;
          visual_quality: string;
          adaptive_intensity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          audio_quality?: string;
          visual_quality?: string;
          adaptive_intensity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          audio_quality?: string;
          visual_quality?: string;
          adaptive_intensity?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
