/**
 * App-wide configuration constants
 */

export const config = {
  app: {
    name: 'Sona',
    version: '1.0.0',
    bundleId: 'com.sona.app',
  },

  // Audio engine configuration
  audio: {
    sampleRate: 44100,
    bufferSize: 512,
    maxPolyphony: 8,
    crossfadeDuration: 4000, // ms
    updateInterval: 30000, // 30 seconds for adaptive updates
  },

  // Adaptive system configuration
  adaptive: {
    updateInterval: 30000, // 30 seconds
    weatherUpdateInterval: 900000, // 15 minutes
    heartRatePollInterval: 10000, // 10 seconds
    timeOfDayUpdateInterval: 300000, // 5 minutes
  },

  // Performance thresholds
  performance: {
    targetFPS: 60,
    cpuThreshold: 0.15, // 15%
    memoryThreshold: 100 * 1024 * 1024, // 100MB
    batteryLowThreshold: 0.2, // 20%
  },

  // Subscription configuration
  subscription: {
    freeModeLimit: 600000, // 10 minutes in ms
    freeModesAvailable: ['focus'],
    premiumModes: ['relax', 'sleep', 'energize'],
    showPaywallAfterSessions: 5,
    showPaywallAfterPlays: 10,
  },

  // API endpoints (will be set via environment variables)
  api: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    weatherApiUrl: 'https://api.open-meteo.com/v1/forecast',
  },

  // Analytics events
  analytics: {
    events: {
      SESSION_START: 'session_start',
      SESSION_END: 'session_end',
      MODE_CHANGE: 'mode_change',
      MIXER_ADJUST: 'mixer_adjust',
      SUBSCRIPTION_SHOWN: 'subscription_shown',
      SUBSCRIPTION_PURCHASED: 'subscription_purchased',
      ONBOARDING_COMPLETE: 'onboarding_complete',
    },
  },
} as const;

export type Config = typeof config;
