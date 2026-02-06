export type MoodState = 'calm' | 'neutral' | 'overwhelmed';

export interface MoodTheme {
  primary: string;
  orbColor: string;
  orbSpeed: number;
  orbTurbulence: number;
  orbPulseIntensity: number;
  glass: string;
  glassBorder: string;
  streakFill: string;
  backgroundPulse: string;
  /** RGB tint for atmospheric shader (0–1 range) */
  bgTint: [number, number, number];
  /** Tint strength for atmospheric shader (0–1) */
  bgTintIntensity: number;
}

export const moodThemes: Record<MoodState, MoodTheme> = {
  calm: {
    primary: '#7DD3FC',
    orbColor: '#38BDF8',
    orbSpeed: 0.3,
    orbTurbulence: 0.1,
    orbPulseIntensity: 0.05,
    glass: 'rgba(125,211,252,0.08)',
    glassBorder: 'rgba(125,211,252,0.15)',
    streakFill: '#7DD3FC',
    backgroundPulse: 'rgba(56,189,248,0.04)',
    bgTint: [0.49, 0.83, 0.99],   // cool blue (#7DD3FC)
    bgTintIntensity: 0.12,
  },
  neutral: {
    primary: '#D4D4D8',
    orbColor: '#A1A1AA',
    orbSpeed: 0.5,
    orbTurbulence: 0.25,
    orbPulseIntensity: 0.1,
    glass: 'rgba(212,212,216,0.08)',
    glassBorder: 'rgba(212,212,216,0.12)',
    streakFill: '#D4D4D8',
    backgroundPulse: 'rgba(161,161,170,0.03)',
    bgTint: [0.83, 0.83, 0.85],   // neutral grey
    bgTintIntensity: 0.0,
  },
  overwhelmed: {
    primary: '#F0A0A0',
    orbColor: '#E88E8E',
    orbSpeed: 0.8,
    orbTurbulence: 0.5,
    orbPulseIntensity: 0.2,
    glass: 'rgba(240,160,160,0.08)',
    glassBorder: 'rgba(240,160,160,0.15)',
    streakFill: '#F0A0A0',
    backgroundPulse: 'rgba(240,160,160,0.06)',
    bgTint: [0.94, 0.63, 0.63],   // soft rose (#F0A0A0)
    bgTintIntensity: 0.08,
  },
};
