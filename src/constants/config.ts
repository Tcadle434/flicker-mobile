/**
 * App-wide configuration constants
 */

export const config = {
  app: {
    name: 'Flicker',
    version: '1.0.0',
    bundleId: 'com.thomascadle.flicker',
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

  // Session modes
  modes: {
    available: ['reset', 'focus', 'move'] as const,
    durations: {
      reset: [0.17, 3, 5, 10, 15, 20, 30] as const, // TODO: remove 0.17 (10s test timer)
      focus: [15, 25, 30, 45, 60, 90, 120] as const,
      move: [15, 30, 45, 60, 90] as const,
    },
  },

  // Reward economy
  rewards: {
    ratesPerMinute: {
      reset: 3,
      focus: 3,
      move: 1,
    },
    streakBonusPerDay: 0.1,    // +10% per consecutive day
    streakBonusCap: 7,          // caps at 7 days = +70%
    balanceBonusMultiplier: 1.5, // all 3 modes in one day
  },

  // Subscription (custom paywall UI backed by RevenueCat)
  subscription: {
    revenueCatApiKeyIos: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || '',
    revenueCatApiKeyAndroid: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || '',
    entitlementId: 'Flicker Pro',
    products: {
      monthly: 'flicker_monthly_v1',
      annual: 'flicker_annual_v1',
    },
  },

  // Spotify Connect
  spotify: {
    clientId: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID || '',
    redirectUrl: process.env.EXPO_PUBLIC_SPOTIFY_REDIRECT_URL || 'flicker://spotify-callback',
    scopes: [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'streaming',
    ],
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
