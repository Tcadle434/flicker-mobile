/**
 * Sona Design System
 *
 * Glassmorphic dark theme with teal accent
 * Inspired by modern audio production interfaces
 */

export const colors = {
  // Background colors
  background: '#0A0A0B',
  surface: '#141416',
  surfaceElevated: '#1A1A1D',

  // Glass effect colors
  glass: 'rgba(255, 255, 255, 0.10)',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
  glassHighlight: 'rgba(255, 255, 255, 0.03)',

  // Text colors
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textTertiary: '#71717A',
  textDisabled: '#52525B',

  // Primary brand color (teal)
  primary: '#2DD4BF',
  primaryDark: '#14B8A6',
  primaryLight: '#5EEAD4',

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Audio visualization colors
  waveform: '#2DD4BF',
  waveformBackground: 'rgba(45, 212, 191, 0.1)',
  vuMeter: '#10B981',
  vuMeterPeak: '#F59E0B',
  vuMeterClip: '#EF4444',

  // Overlay colors
  overlay: 'rgba(10, 10, 11, 0.8)',
  overlayLight: 'rgba(10, 10, 11, 0.4)',
  overlayDark: 'rgba(10, 10, 11, 0.95)',

  // Border colors
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.05)',
  borderDark: 'rgba(255, 255, 255, 0.15)',
} as const;

export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },
  fontWeight: {
    light: '300' as const,
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeight: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 40,
    xxxl: 56,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const animations = {
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },
  easing: {
    easeInOut: [0.4, 0.0, 0.2, 1] as const,
    easeOut: [0.0, 0.0, 0.2, 1] as const,
    easeIn: [0.4, 0.0, 1, 1] as const,
    spring: [0.5, 1.0, 0.89, 1.0] as const,
  },
} as const;

export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.md,
  buttonHeight: 56,
  inputHeight: 48,
  tabBarHeight: 64,
  headerHeight: 56,
} as const;

export const glassmorphism = {
  light: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  dark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  layout,
  glassmorphism,
} as const;

export type Theme = typeof theme;
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
