/**
 * Paywall Service
 *
 * Handles feature gating and paywall display logic
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../../constants/config';
import type { SoundscapeMode } from '../../types';

const STORAGE_KEYS = {
  SESSION_COUNT: '@sona:session_count',
  PLAY_COUNT: '@sona:play_count',
  PAYWALL_SHOWN_COUNT: '@sona:paywall_shown_count',
  LAST_PAYWALL_SHOWN: '@sona:last_paywall_shown',
};

export class PaywallService {
  /**
   * Check if a mode is available for free users
   */
  isModeAvailableForFree(mode: SoundscapeMode): boolean {
    return config.subscription.freeModesAvailable.includes(mode as any);
  }

  /**
   * Check if feature is accessible (for free or premium users)
   */
  async canAccessFeature(
    feature: 'mode' | 'full_mixer' | 'unlimited_session',
    isPremium: boolean,
    mode?: SoundscapeMode
  ): Promise<boolean> {
    if (isPremium) {
      return true;
    }

    switch (feature) {
      case 'mode':
        if (!mode) return false;
        return this.isModeAvailableForFree(mode);

      case 'full_mixer':
        // Free users only get 3 layers (Ambient, Nature, Synthesis)
        return false;

      case 'unlimited_session':
        // Free users have 10-minute session limit
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if session duration exceeds free tier limit
   */
  isSessionDurationLimitExceeded(durationMs: number, isPremium: boolean): boolean {
    if (isPremium) {
      return false;
    }

    return durationMs >= config.subscription.freeModeLimit;
  }

  /**
   * Check if paywall should be shown
   */
  async shouldShowPaywall(isPremium: boolean): Promise<boolean> {
    if (isPremium) {
      return false;
    }

    try {
      const sessionCount = await this.getSessionCount();
      const playCount = await this.getPlayCount();
      const lastShown = await this.getLastPaywallShown();

      // Don't show paywall too frequently (at least 24 hours apart)
      if (lastShown) {
        const hoursSinceLastShown = (Date.now() - lastShown) / (1000 * 60 * 60);
        if (hoursSinceLastShown < 24) {
          return false;
        }
      }

      // Show after X sessions or Y plays
      return (
        sessionCount >= config.subscription.showPaywallAfterSessions ||
        playCount >= config.subscription.showPaywallAfterPlays
      );
    } catch (error) {
      console.error('Error checking paywall status:', error);
      return false;
    }
  }

  /**
   * Mark paywall as shown
   */
  async markPaywallShown(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_PAYWALL_SHOWN, Date.now().toString());

      const count = await this.getPaywallShownCount();
      await AsyncStorage.setItem(STORAGE_KEYS.PAYWALL_SHOWN_COUNT, (count + 1).toString());
    } catch (error) {
      console.error('Error marking paywall shown:', error);
    }
  }

  /**
   * Increment session count
   */
  async incrementSessionCount(): Promise<void> {
    try {
      const count = await this.getSessionCount();
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_COUNT, (count + 1).toString());
    } catch (error) {
      console.error('Error incrementing session count:', error);
    }
  }

  /**
   * Increment play count
   */
  async incrementPlayCount(): Promise<void> {
    try {
      const count = await this.getPlayCount();
      await AsyncStorage.setItem(STORAGE_KEYS.PLAY_COUNT, (count + 1).toString());
    } catch (error) {
      console.error('Error incrementing play count:', error);
    }
  }

  /**
   * Get session count
   */
  private async getSessionCount(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_COUNT);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get play count
   */
  private async getPlayCount(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.PLAY_COUNT);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get paywall shown count
   */
  private async getPaywallShownCount(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.PAYWALL_SHOWN_COUNT);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get last time paywall was shown
   */
  private async getLastPaywallShown(): Promise<number | null> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.LAST_PAYWALL_SHOWN);
      return value ? parseInt(value, 10) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Reset paywall tracking (for testing)
   */
  async resetPaywallTracking(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SESSION_COUNT,
        STORAGE_KEYS.PLAY_COUNT,
        STORAGE_KEYS.PAYWALL_SHOWN_COUNT,
        STORAGE_KEYS.LAST_PAYWALL_SHOWN,
      ]);
    } catch (error) {
      console.error('Error resetting paywall tracking:', error);
    }
  }
}

export const paywallService = new PaywallService();
