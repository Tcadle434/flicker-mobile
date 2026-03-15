/**
 * Common TypeScript types for Flicker
 */

// ============================================================================
// Audio Types
// ============================================================================

export type SoundscapeMode = 'focus' | 'relax' | 'sleep' | 'energize';

export type AudioLayer = 'ambient' | 'nature' | 'melody' | 'rhythm' | 'synthesis';

export interface AudioLayerState {
  id: AudioLayer;
  volume: number;
  muted: boolean;
  currentLoopId: string | null;
}

export interface LoopMetadata {
  id: string;
  filename: string;
  duration: number;
  key?: string;
  tags: {
    mode: SoundscapeMode[];
    energy: number; // -1 to 1
    density: number; // -1 to 1
    timeOfDay: TimeOfDay[];
    weather: WeatherCondition[];
    season: Season[];
  };
  defaultVolume: number;
  crossfadeDuration: number;
}

export interface ModeManifest {
  id: SoundscapeMode;
  name: string;
  description: string;
  color: string;
  loops: {
    [key in AudioLayer]?: string[]; // Array of loop IDs
  };
  defaultMix: {
    [key in AudioLayer]?: number; // Default volume 0-1
  };
  binauralFrequency?: {
    min: number;
    max: number;
  };
}

// ============================================================================
// Adaptive System Types
// ============================================================================

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'late-night';

export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface AdaptiveInputs {
  timeOfDay: {
    value: TimeOfDay;
    hour: number;
    phase: number; // 0-1, circadian rhythm phase
  };
  weather: {
    condition: WeatherCondition;
    temperature: number;
    humidity: number;
    cloudCover: number;
  } | null;
  heartRate: {
    bpm: number;
    variability: number;
  } | null;
  season: Season;
}

export interface AdaptiveParameters {
  energy: number; // -1 to 1
  density: number; // -1 to 1
  brightness: number; // 0 to 1
  tempo: number; // 0.8 to 1.2
  binauralFrequency: number; // Hz
}

// ============================================================================
// User & Auth Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  createdAt: string;
  isPremium: boolean;
  subscriptionStatus: SubscriptionStatus;
}

export type SubscriptionStatus = 'free' | 'trial' | 'active' | 'expired' | 'canceled';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Player State Types
// ============================================================================

export type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface PlayerState {
  mode: SoundscapeMode;
  playbackState: PlaybackState;
  layers: Record<AudioLayer, AudioLayerState>;
  masterVolume: number;
  adaptiveEnabled: boolean;
  adaptiveInputs: AdaptiveInputs;
  adaptiveParameters: AdaptiveParameters;
}

// ============================================================================
// UI Types
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface CardProps {
  glass?: boolean;
  elevated?: boolean;
  padding?: keyof typeof import('../constants/theme').spacing;
}

// ============================================================================
// Mood & Session Types
// ============================================================================

export type { MoodState } from '../constants/moodThemes';

export type SessionPhase = 'idle' | 'fade' | 'still' | 'return' | 'active' | 'complete';

export interface WeeklyStreak {
  weeklyMarks: boolean[]; // 7 bools, index 0 = Monday
  overallStreak: number;
  totalSessions: number;
  lastSessionAt: number | null;
}

// ============================================================================
// Scene/Rendering Types
// ============================================================================

export type SceneQuality = 'low' | 'medium' | 'high';

export interface SceneConfig {
  quality: SceneQuality;
  particleCount: number;
  enablePostProcessing: boolean;
}

export interface AudioVisualizerData {
  frequencies: Float32Array;
  waveform: Float32Array;
  rms: number;
  peak: number;
}

// ============================================================================
// Onboarding & Settings Types
// ============================================================================

export interface OnboardingPreferences {
  goals: string[];
  screenTime: string;        // "under-2h" | "2-4h" | "4-6h" | "6-8h" | "8h+"
  screenTimeHours: number;   // numeric value for calculations
  distraction: string;
  noisiest: string;          // when mind feels noisiest
  birthDate: string;         // ISO date string or empty
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  preferences: OnboardingPreferences;
  permissionsGranted: {
    notifications: boolean;
    screenTime: boolean;
    tracking: boolean;
  };
}

export interface AppSettings {
  audioQuality: 'low' | 'medium' | 'high';
  visualQuality: SceneQuality;
  backgroundPlayback: boolean;
  adaptiveIntensity: number; // 0-1
  adaptiveInputsEnabled: {
    timeOfDay: boolean;
    weather: boolean;
    heartRate: boolean;
    season: boolean;
  };
  notifications: {
    dailyReminders: boolean;
    sessionComplete: boolean;
  };
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
}

export interface SessionMetrics {
  duration: number;
  mode: SoundscapeMode;
  adaptiveInputsUsed: string[];
  mixerAdjustments: number;
}
