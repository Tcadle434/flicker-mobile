/**
 * appBlockingBridge.ts
 *
 * Higher-level bridge that maps session modes to blocking modes.
 * All calls are fire-and-forget — blocking failures never crash the session flow.
 */

import { NativeAppBlocking } from './nativeAppBlockingModule';
import type { SessionMode } from '../../stores/sessionStore';

// MARK: - Blocking mode mapping

/**
 * Maps session modes to blocking intensity:
 * - Reset → "full" (block everything)
 * - Focus → "full" (block everything, user can configure allowlist)
 * - Move  → "light" (allow music/maps/health, block social/entertainment)
 */
function getBlockingMode(sessionMode: SessionMode): 'full' | 'light' {
  switch (sessionMode) {
    case 'reset':
      return 'full';
    case 'focus':
      return 'full';
    case 'move':
      return 'light';
    default:
      return 'full';
  }
}

// MARK: - Public API

export const appBlockingBridge = {
  /**
   * Request FamilyControls authorization.
   * Returns true if authorization was granted.
   */
  requestAuthorization: async (): Promise<boolean> => {
    const result = await NativeAppBlocking.requestAuthorization();
    return result.success;
  },

  /**
   * Check if app blocking is authorized.
   */
  isAuthorized: async (): Promise<boolean> => {
    const status = await NativeAppBlocking.getAuthorizationStatus();
    return status === 'approved';
  },

  /**
   * Start blocking apps for a given session mode.
   * Fire-and-forget safe — never throws.
   */
  startBlocking: async (sessionMode: SessionMode): Promise<void> => {
    const blockingMode = getBlockingMode(sessionMode);
    await NativeAppBlocking.startBlocking(blockingMode, sessionMode);
  },

  /**
   * Stop all app blocking.
   * Fire-and-forget safe — never throws.
   */
  stopBlocking: async (): Promise<void> => {
    await NativeAppBlocking.stopBlocking();
  },

  /**
   * Present the native app picker for selecting which apps to block.
   */
  presentAppPicker: async (): Promise<boolean> => {
    const result = await NativeAppBlocking.presentAppPicker();
    return result.success;
  },

  /**
   * Get current blocking state.
   */
  getState: async () => {
    return NativeAppBlocking.getBlockingState();
  },
};

export default appBlockingBridge;
