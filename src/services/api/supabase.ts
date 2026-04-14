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
      flowType: 'pkce',
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
          light_balance: number;
          lifetime_earned: number;
          onboarding_completed: boolean;
          trial_started_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          is_premium?: boolean;
          subscription_status?: string;
          light_balance?: number;
          lifetime_earned?: number;
          onboarding_completed?: boolean;
          trial_started_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          is_premium?: boolean;
          subscription_status?: string;
          light_balance?: number;
          lifetime_earned?: number;
          onboarding_completed?: boolean;
          trial_started_at?: string | null;
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
      session_logs: {
        Row: {
          id: string;
          user_id: string;
          mode: string;
          target_seconds: number;
          elapsed_seconds: number;
          status: string;
          light_earned: number;
          activity_tag: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          mode: string;
          target_seconds: number;
          elapsed_seconds: number;
          status: string;
          light_earned?: number;
          activity_tag?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: string;
          target_seconds?: number;
          elapsed_seconds?: number;
          status?: string;
          light_earned?: number;
          activity_tag?: string | null;
          created_at?: string;
        };
      };
      currency_transactions: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          amount: number;
          type: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          session_id?: string | null;
          amount: number;
          type: string;
          source: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          amount?: number;
          type?: string;
          source?: string;
          created_at?: string;
        };
      };
      sanctuary_unlocks: {
        Row: {
          user_id: string;
          zone_id: string;
          unlocked_at: string;
        };
        Insert: {
          user_id: string;
          zone_id: string;
          unlocked_at?: string;
        };
        Update: {
          user_id?: string;
          zone_id?: string;
          unlocked_at?: string;
        };
      };
      sanctuary_placements: {
        Row: {
          id: string;
          user_id: string;
          zone_id: string;
          anchor_id: string;
          item_id: string;
          placed_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          zone_id: string;
          anchor_id: string;
          item_id: string;
          placed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          zone_id?: string;
          anchor_id?: string;
          item_id?: string;
          placed_at?: string;
        };
      };
      tent_placements: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          room_id: string;
          tile_x: number;
          tile_y: number;
          direction: string;
          scale: number;
          placed_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          item_id: string;
          room_id?: string;
          tile_x: number;
          tile_y: number;
          direction?: string;
          scale?: number;
          placed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          room_id?: string;
          tile_x?: number;
          tile_y?: number;
          direction?: string;
          scale?: number;
          placed_at?: string;
        };
      };
      tent_owned_surface_styles: {
        Row: {
          user_id: string;
          style_id: string;
          surface_type: string;
          purchased_at: string;
        };
        Insert: {
          user_id: string;
          style_id: string;
          surface_type: string;
          purchased_at?: string;
        };
        Update: {
          user_id?: string;
          style_id?: string;
          surface_type?: string;
          purchased_at?: string;
        };
      };
      tent_room_styles: {
        Row: {
          user_id: string;
          room_id: string;
          floor_style_id: string | null;
          wall_style_id: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          room_id: string;
          floor_style_id?: string | null;
          wall_style_id?: string | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          room_id?: string;
          floor_style_id?: string | null;
          wall_style_id?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
