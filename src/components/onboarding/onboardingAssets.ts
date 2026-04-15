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

  // Flicker calm meditate spritesheet (8x8 grid)
  flickerCalmMeditate: require('../../../assets/sprites/flicker_calm_meditate.png'),

  // Recorded onboarding demo video
  flickerAppDemoVideo: require('../../../assets/onboarding/Flicker_app_demo.mp4'),

  // Sanctuary decorations for demo
  pottedPlant: require('../../../assets/sprites/interior-decorations/potted_plant_01.png'),
  floorLamp: require('../../../assets/sprites/interior-decorations/floor_lamp_01.png'),
  bookshelf: require('../../../assets/sprites/interior-decorations/bookshelf_01.png'),

  // Tilesets for demo scenes (referenced by Skia useImage, but warm via RN Image cache)
  zenGardenTileset: require('../../../assets/tiled/zen-garden-tileset.png'),
  interiorsTs: require('../../../assets/tiled/Interiors_16x16.png'),
  roomBuilderTs: require('../../../assets/tiled/Room_Builder_16x16.png'),
  interiorTilesTs: require('../../../assets/tiled/interior_tiles.png'),
  interiorTilesRoofTs: require('../../../assets/tiled/interior_tiles_and_roof.png'),
  interiorSpritesTs: require('../../../assets/tiled/interior_sprites.png'),
} as const;

export const ONBOARDING_WARMUP_ASSETS = [
  ONBOARDING_ASSETS.tigerDiagram,
  ONBOARDING_ASSETS.brainDiagram,
  ONBOARDING_ASSETS.bodyStressDiagram,
  ONBOARDING_ASSETS.phoneNotificationDiagram,
  ONBOARDING_ASSETS.alertVsRecovery,
  ONBOARDING_ASSETS.flickerCalmMeditate,
  ONBOARDING_ASSETS.pottedPlant,
] as const;

/** Heavy assets for the cinematic demo — warm around step 5-6 */
export const DEMO_HEAVY_ASSETS = [
  ONBOARDING_ASSETS.flickerAppDemoVideo,
] as const;

let demoWarmupPromise: Promise<unknown> | null = null;

export function warmDemoAssets() {
  if (!demoWarmupPromise) {
    const { Asset } = require('expo-asset');
    demoWarmupPromise = Asset.loadAsync([...DEMO_HEAVY_ASSETS]);
  }
  return demoWarmupPromise;
}

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

// Flicker calm meditate spritesheet metadata (4096x2344, 8x8 grid)
export const FLICKER_MEDITATE_META = {
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
