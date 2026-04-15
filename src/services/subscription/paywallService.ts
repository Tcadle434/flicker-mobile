/**
 * Subscription Service — RevenueCat
 *
 * Flicker uses a custom React Native paywall backed by RevenueCat for
 * product metadata, purchases, restores, and entitlement state.
 */

import { Platform } from 'react-native';
import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  type PurchasesStoreProduct,
} from 'react-native-purchases';
import { config } from '../../constants/config';

export interface EntitlementState {
  isEntitled: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
}

export interface OfferingProduct {
  productId: string;
  title: string;
  description: string;
  price: number;
  priceString: string;
  subscriptionPeriod: string | null;
  pricePerWeekString: string | null;
  pricePerMonthString: string | null;
  pricePerYearString: string | null;
  introPrice: {
    price: number;
    priceString: string;
    periodUnit: string;
    periodNumberOfUnits: number;
  } | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function getRevenueCatApiKey(): string {
  if (Platform.OS === 'ios') {
    return config.subscription.revenueCatApiKeyIos;
  }

  if (Platform.OS === 'android') {
    return config.subscription.revenueCatApiKeyAndroid;
  }

  return '';
}

function isSamePackageTarget(aPackage: PurchasesPackage, productId: string): boolean {
  return aPackage.product.identifier === productId;
}

function mapStoreProduct(product: PurchasesStoreProduct): OfferingProduct {
  return {
    productId: product.identifier,
    title: product.title,
    description: product.description,
    price: product.price,
    priceString: product.priceString,
    subscriptionPeriod: product.subscriptionPeriod,
    pricePerWeekString: product.pricePerWeekString,
    pricePerMonthString: product.pricePerMonthString,
    pricePerYearString: product.pricePerYearString,
    introPrice: product.introPrice
      ? {
          price: product.introPrice.price,
          priceString: product.introPrice.priceString,
          periodUnit: product.introPrice.periodUnit,
          periodNumberOfUnits: product.introPrice.periodNumberOfUnits,
        }
      : null,
  };
}

class PaywallService {
  private initialized = false;
  private warnedMissingKey = false;
  private syncedAppUserId: string | null = null;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      if (!this.warnedMissingKey) {
        this.warnedMissingKey = true;
        console.warn('[SubscriptionService] No RevenueCat API key configured.');
      }
      return;
    }

    Purchases.configure({ apiKey });
    await Purchases.setLogLevel(
      __DEV__ ? Purchases.LOG_LEVEL.DEBUG : Purchases.LOG_LEVEL.INFO,
    );

    this.initialized = true;
  }

  async syncIdentity(appUserId: string | null): Promise<void> {
    await this.initialize();
    if (!this.initialized) return;

    if (this.syncedAppUserId === appUserId) {
      return;
    }

    try {
      if (appUserId) {
        await Purchases.logIn(appUserId);
        this.syncedAppUserId = appUserId;
        return;
      }

      try {
        await Purchases.logOut();
      } catch (error: unknown) {
        const purchasesError = error as { code?: string };
        if (
          purchasesError?.code !== Purchases.PURCHASES_ERROR_CODE.LOG_OUT_ANONYMOUS_USER_ERROR
        ) {
          throw error;
        }
      }

      this.syncedAppUserId = null;
    } catch (error) {
      console.error('[SubscriptionService] Failed to sync RevenueCat identity:', error);
    }
  }

  private getEntitlementStateFromCustomerInfo(customerInfo: CustomerInfo): EntitlementState {
    const entitlement = customerInfo.entitlements.active[config.subscription.entitlementId];
    const isEntitled = entitlement?.isActive === true;
    const isTrialActive = entitlement?.periodType === 'TRIAL';

    let trialDaysRemaining = 0;
    if (isTrialActive && entitlement.expirationDateMillis != null) {
      trialDaysRemaining = Math.max(
        0,
        Math.ceil((entitlement.expirationDateMillis - Date.now()) / DAY_MS),
      );
    }

    return {
      isEntitled,
      isTrialActive,
      trialDaysRemaining,
    };
  }

  async getEntitlementState(): Promise<EntitlementState> {
    await this.initialize();
    if (!this.initialized) {
      return { isEntitled: false, isTrialActive: false, trialDaysRemaining: 0 };
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return this.getEntitlementStateFromCustomerInfo(customerInfo);
    } catch (error) {
      console.error('[SubscriptionService] Failed to get RevenueCat customer info:', error);
      return { isEntitled: false, isTrialActive: false, trialDaysRemaining: 0 };
    }
  }

  async getDefaultOfferingProducts(): Promise<OfferingProduct[]> {
    await this.initialize();
    if (!this.initialized) return [];

    try {
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings.current;
      if (!currentOffering) return [];

      const products = currentOffering.availablePackages.map((aPackage) =>
        mapStoreProduct(aPackage.product),
      );

      const uniqueByProductId = new Map<string, OfferingProduct>();
      for (const product of products) {
        uniqueByProductId.set(product.productId, product);
      }

      return [...uniqueByProductId.values()];
    } catch (error) {
      console.error('[SubscriptionService] Failed to get RevenueCat offerings:', error);
      return [];
    }
  }

  private async getCurrentOffering(): Promise<PurchasesOffering | null> {
    await this.initialize();
    if (!this.initialized) return null;

    const offerings = await Purchases.getOfferings();
    return offerings.current;
  }

  async purchaseProduct(productId: string): Promise<EntitlementState> {
    await this.initialize();
    if (!this.initialized) {
      throw new Error('RevenueCat is not configured.');
    }

    const currentOffering = await this.getCurrentOffering();
    const selectedPackage = currentOffering?.availablePackages.find((aPackage) =>
      isSamePackageTarget(aPackage, productId),
    );

    const result = selectedPackage
      ? await Purchases.purchasePackage(selectedPackage)
      : await this.purchaseFallbackProduct(productId);

    return this.getEntitlementStateFromCustomerInfo(result.customerInfo);
  }

  private async purchaseFallbackProduct(
    productId: string,
  ): Promise<{ customerInfo: CustomerInfo }> {
    const products = await Purchases.getProducts(
      [productId],
      Purchases.PRODUCT_CATEGORY.SUBSCRIPTION,
    );
    const product = products.find((item) => item.identifier === productId);

    if (!product) {
      throw new Error(`Product ${productId} is not available in RevenueCat.`);
    }

    const result = await Purchases.purchaseStoreProduct(product);
    return { customerInfo: result.customerInfo };
  }

  async restorePurchases(): Promise<EntitlementState> {
    await this.initialize();
    if (!this.initialized) {
      return { isEntitled: false, isTrialActive: false, trialDaysRemaining: 0 };
    }

    const customerInfo = await Purchases.restorePurchases();
    return this.getEntitlementStateFromCustomerInfo(customerInfo);
  }

  async presentPaywall(_placement?: string): Promise<'dismissed'> {
    console.warn(
      '[SubscriptionService] presentPaywall() is deprecated. Flicker uses a custom React Native paywall.',
    );
    return 'dismissed';
  }
}

export const paywallService = new PaywallService();
