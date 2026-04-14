/**
 * purchaseService.ts
 *
 * Purchase service for Flicker subscriptions.
 * Currently a mock — replace the purchase() body with Superwall / StoreKit 2
 * calls when the official integration is ready.
 *
 * Product IDs (App Store Connect):
 *   flicker_annual_v1   — $19.99/year  (Apple ID: 6762213563)
 *   flicker_monthly_v1  — $3.99/month  (Apple ID: 6762020606)
 */

export type ProductID = 'flicker_annual_v1' | 'flicker_monthly_v1';

export interface PurchaseResult {
  success: boolean;
  productID?: ProductID;
  error?: string;
}

// ---------------------------------------------------------------------------
// Mock implementation — simulates a successful purchase after a short delay.
// Replace with Superwall SDK calls when configured:
//
//   import Superwall from '@superwall/react-native-superwall';
//   await Superwall.shared.register('paywall_onboarding');
//
// ---------------------------------------------------------------------------

export const purchaseService = {
  /**
   * Attempt to purchase a subscription.
   * Returns true if the purchase (or trial start) succeeded.
   */
  purchase: async (productID: ProductID): Promise<PurchaseResult> => {
    console.log('[PurchaseService] purchasing:', productID);

    // TODO: Replace with real StoreKit / Superwall call
    await new Promise((resolve) => setTimeout(resolve, 900));

    console.log('[PurchaseService] mock purchase success:', productID);
    return { success: true, productID };
  },

  /**
   * Restore previous purchases.
   */
  restore: async (): Promise<PurchaseResult> => {
    console.log('[PurchaseService] restoring purchases');

    // TODO: Replace with real restore flow
    await new Promise((resolve) => setTimeout(resolve, 600));

    return { success: false, error: 'No active subscription found' };
  },
};

export default purchaseService;
