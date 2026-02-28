/**
 * nativeAppBlockingModule.ts
 *
 * TypeScript wrapper for native FamilyControls/ManagedSettings app blocking.
 * Mirrors the pattern established by nativeAudioModule.ts.
 */

import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

// MARK: - Types

export type AuthorizationStatus = 'notDetermined' | 'approved' | 'denied' | 'unavailable';

export interface AuthorizationResult {
  success: boolean;
  error?: string;
}

export interface BlockingResult {
  success: boolean;
  error?: string;
}

export interface BlockingState {
  isBlocking: boolean;
  mode: string;
  sessionMode: string;
}

// MARK: - Native Module

let cachedModule: Record<string, any> | null | undefined;
let moduleUnavailableWarned = false;

const getNativeModule = (): Record<string, any> | null => {
  if (Platform.OS !== 'ios') return null;
  if (cachedModule !== undefined) return cachedModule;

  try {
    cachedModule = requireNativeModule('FlickerAppBlocking') as Record<string, any>;
    return cachedModule;
  } catch (error) {
    cachedModule = null;
    if (!moduleUnavailableWarned) {
      moduleUnavailableWarned = true;
      console.warn('[NativeAppBlocking] FlickerAppBlocking native module unavailable');
    }
    return null;
  }
};

// MARK: - Native App Blocking API

export const NativeAppBlocking = {
  /**
   * Request FamilyControls authorization from the user.
   */
  requestAuthorization: async (): Promise<AuthorizationResult> => {
    const FlickerAppBlocking = getNativeModule();
    if (!FlickerAppBlocking) return { success: false, error: 'iOS only' };
    try {
      return await FlickerAppBlocking.requestAuthorization();
    } catch (error) {
      console.error('[NativeAppBlocking] requestAuthorization error:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Get current authorization status.
   */
  getAuthorizationStatus: async (): Promise<AuthorizationStatus> => {
    const FlickerAppBlocking = getNativeModule();
    if (!FlickerAppBlocking) return 'unavailable';
    try {
      const result = await FlickerAppBlocking.getAuthorizationStatus();
      return result.status as AuthorizationStatus;
    } catch (error) {
      console.error('[NativeAppBlocking] getAuthorizationStatus error:', error);
      return 'unavailable';
    }
  },

  /**
   * Start blocking apps.
   * @param mode "full" or "light"
   * @param sessionMode "reset", "focus", or "move"
   */
  startBlocking: async (mode: string, sessionMode: string): Promise<BlockingResult> => {
    const FlickerAppBlocking = getNativeModule();
    if (!FlickerAppBlocking) return { success: false, error: 'iOS only' };
    try {
      return await FlickerAppBlocking.startBlocking(mode, sessionMode);
    } catch (error) {
      console.error('[NativeAppBlocking] startBlocking error:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Stop all blocking and remove shields.
   */
  stopBlocking: async (): Promise<BlockingResult> => {
    const FlickerAppBlocking = getNativeModule();
    if (!FlickerAppBlocking) return { success: false, error: 'iOS only' };
    try {
      return await FlickerAppBlocking.stopBlocking();
    } catch (error) {
      console.error('[NativeAppBlocking] stopBlocking error:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Present the native FamilyActivityPicker for selecting apps to block.
   */
  presentAppPicker: async (): Promise<BlockingResult> => {
    const FlickerAppBlocking = getNativeModule();
    if (!FlickerAppBlocking) return { success: false, error: 'iOS only' };
    try {
      return await FlickerAppBlocking.presentAppPicker();
    } catch (error) {
      console.error('[NativeAppBlocking] presentAppPicker error:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Get current blocking state.
   */
  getBlockingState: async (): Promise<BlockingState> => {
    const FlickerAppBlocking = getNativeModule();
    if (!FlickerAppBlocking) return { isBlocking: false, mode: 'none', sessionMode: 'focus' };
    try {
      return await FlickerAppBlocking.getBlockingState();
    } catch (error) {
      console.error('[NativeAppBlocking] getBlockingState error:', error);
      return { isBlocking: false, mode: 'none', sessionMode: 'focus' };
    }
  },
};

export default NativeAppBlocking;
