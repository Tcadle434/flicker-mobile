/**
 * purchaseService.ts
 *
 * Purchase helpers for Flicker's custom React Native paywall.
 * RevenueCat is the source of truth for products, purchases, and restores.
 */

import Purchases from 'react-native-purchases';
import {
  paywallService,
  type OfferingProduct,
} from '../subscription/paywallService';

export type ProductID = 'flicker_annual_v1' | 'flicker_monthly_v1';

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  productID?: ProductID;
  error?: string;
}

export interface PaywallProduct extends OfferingProduct {
  productID: ProductID;
  isTrialEligible?: boolean;
}

function isKnownProductId(productId: string): productId is ProductID {
  return productId === 'flicker_annual_v1' || productId === 'flicker_monthly_v1';
}

export const purchaseService = {
  async getProducts(): Promise<PaywallProduct[]> {
    const products = await paywallService.getDefaultOfferingProducts();
    const knownProducts = products.filter((product) => isKnownProductId(product.productId));
    let trialEligibilityById: Record<string, boolean> = {};

    if (knownProducts.length > 0) {
      try {
        const introEligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(
          knownProducts.map((product) => product.productId),
        );

        trialEligibilityById = Object.fromEntries(
          Object.entries(introEligibility).map(([productId, eligibility]) => [
            productId,
            eligibility.status ===
              Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE,
          ]),
        );
      } catch (error) {
        console.warn('[PurchaseService] Failed to check trial eligibility', error);
      }
    }

    return knownProducts
      .map((product) => ({
        ...product,
        productID: product.productId as ProductID,
        isTrialEligible: trialEligibilityById[product.productId],
      }));
  },

  async purchase(productID: ProductID): Promise<PurchaseResult> {
    try {
      const state = await paywallService.purchaseProduct(productID);
      return {
        success: state.isEntitled,
        productID,
        error: state.isEntitled ? undefined : 'Purchase completed without unlocking the entitlement.',
      };
    } catch (error) {
      const purchasesError = error as { code?: string; message?: string; userCancelled?: boolean | null };
      const userCancelled =
        purchasesError?.code === Purchases.PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR ||
        purchasesError?.userCancelled === true;

      return {
        success: false,
        cancelled: userCancelled,
        error: userCancelled ? undefined : (purchasesError?.message ?? 'Purchase failed.'),
      };
    }
  },

  async restore(): Promise<PurchaseResult> {
    try {
      const state = await paywallService.restorePurchases();
      return {
        success: state.isEntitled,
        error: state.isEntitled ? undefined : 'No active subscription found.',
      };
    } catch (error) {
      const purchasesError = error as { message?: string };
      return {
        success: false,
        error: purchasesError?.message ?? 'Failed to restore purchases.',
      };
    }
  },
};

export default purchaseService;
