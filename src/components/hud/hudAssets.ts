/**
 * Centralized map of HUD image assets.
 * Swap in new art by changing the require() — zero code changes elsewhere.
 */
export const HUD_ASSETS = {
  startSession: require('../../../assets/ui/btn-start-session.png'),
  settings: require('../../../assets/ui/btn-icon-settings.png'),
  shop: require('../../../assets/ui/btn-icon-shop.png'),
  decorate: require('../../../assets/ui/btn-icon-decorate.png'),
  calendar: require('../../../assets/ui/btn-icon-calendar.png'),
  panelBg: null,      // → require('../../../assets/ui/panel-bg.png')
  lightCrystal: require('../../../assets/ui/light-icon.png'),
  begin: null,        // → require('../../../assets/ui/btn-begin.png')

  // Tent HUD icons
  backArrow: require('../../../assets/ui/hud-back-arrow.png'),
  checkmark: require('../../../assets/ui/hud-checkmark.png'),
  xClose: require('../../../assets/ui/hud-x.png'),
  rotate: require('../../../assets/ui/hud-rotate.png'),
  edit: require('../../../assets/ui/hud-edit.png'),

  // Component backgrounds (pixel art frames)
  componentBg: require('../../../assets/ui/component-background.png'),
  componentBg1: require('../../../assets/ui/component-background-1.png'),
  componentBg2: require('../../../assets/ui/component-background-2.png'),
  itemShopBg: require('../../../assets/ui/item-shop-background.png'),

  balanceBg: require('../../../assets/ui/balance_component_background.png'),

  // Volume icons
  volumeUnmuted: require('../../../assets/ui/volume_unmuted.png'),
  volumeMuted: require('../../../assets/ui/volume_muted.png'),
} as const;
