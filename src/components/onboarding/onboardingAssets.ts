/**
 * Onboarding Asset Map
 *
 * Centralized asset references for the onboarding flow.
 * Following the hudAssets.ts pattern.
 */

export const ONBOARDING_ASSETS = {
  // Flicker character sprite (calm idle — transparent bg, 8x8 grid, 61 frames)
  flickerCalmIdle: require('../../../assets/sprites/flicker_calm_idle.png'),

  // Flicker overwhelmed idle (8x8 grid, 4096x2344)
  flickerOverwhelmedIdle: require('../../../assets/sprites/flicker_overwhelmed_idle.png'),

  // Flicker calm focus (8x8 grid, 4096x2344)
  flickerCalmFocus: require('../../../assets/sprites/flicker_calm_focus.png'),

  // Tilemap
  forestTileset: require('../../../assets/tiled/flicker-forest.png'),

  // Existing HUD assets reused in onboarding
  continueButton: require('../../../assets/ui/button_press_spritesheet.png'),
  lightIcon: require('../../../assets/ui/light-icon.png'),
  tentExterior: require('../../../assets/sprites/flicker-tent-exterior.png'),
  tigerDiagram: require('../../../assets/onboarding/tiger_diagram.png'),
  brainDiagram: require('../../../assets/onboarding/brain_diagram.png'),
  bodyStressDiagram: require('../../../assets/onboarding/body_stress_diagram.png'),
  phoneNotificationDiagram: require('../../../assets/onboarding/phone_notification_diagram.png'),
  alertVsRecovery: require('../../../assets/onboarding/alert_vs_recovery.png'),
  sessionScreenshot: require('../../../assets/session_screenshot.png'),
  flickerOverwhelmedBase: require('../../../assets/flicker_overwhelmed_base_transparent.png'),
  flickerCalmBase: require('../../../assets/flicker_calm_base_transparent.png'),
} as const;

export const ONBOARDING_WARMUP_ASSETS = [
  ONBOARDING_ASSETS.tigerDiagram,
  ONBOARDING_ASSETS.brainDiagram,
  ONBOARDING_ASSETS.bodyStressDiagram,
  ONBOARDING_ASSETS.phoneNotificationDiagram,
  ONBOARDING_ASSETS.alertVsRecovery,
] as const;

// Flicker calm idle spritesheet metadata
export const FLICKER_IDLE_META = {
  columns: 8,
  rows: 8,
  frameWidth: 512,
  frameHeight: 298,
  frameCount: 61,
  fps: 12,
} as const;

// Flicker overwhelmed idle spritesheet metadata (4096x2344, 8x8 grid)
export const FLICKER_OVERWHELMED_META = {
  columns: 8,
  rows: 8,
  frameWidth: 512,
  frameHeight: 293,
  frameCount: 61,
  fps: 12,
} as const;

// Flicker calm focus spritesheet metadata (4096x2344, 8x8 grid)
export const FLICKER_FOCUS_META = {
  columns: 8,
  rows: 8,
  frameWidth: 512,
  frameHeight: 293,
  frameCount: 61,
  fps: 12,
} as const;

// Button press spritesheet metadata (4 frames, 96x32 each)
export const BUTTON_META = {
  frameWidth: 96,
  frameHeight: 32,
  frameCount: 4,
  frameDuration: 70,
} as const;
