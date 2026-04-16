import { Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { IOS_APP_STORE_ID, IOS_APP_STORE_URL } from '../../config/appConfig';
import { logger } from '../../lib/logger';

export const IOS_WRITE_REVIEW_URL =
  `itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${IOS_APP_STORE_ID}?action=write-review`;
export const IOS_WEB_REVIEW_URL = `${IOS_APP_STORE_URL}?action=write-review`;

class ReviewService {
  async requestInAppReview(): Promise<{ available: boolean; attempted: boolean }> {
    if (Platform.OS !== 'ios') {
      return { available: false, attempted: false };
    }

    try {
      const available = await StoreReview.isAvailableAsync();
      if (!available) {
        logger.info('In-app review unavailable');
        return { available: false, attempted: false };
      }

      await StoreReview.requestReview();
      logger.info('In-app review requested');
      return { available: true, attempted: true };
    } catch (error) {
      logger.warn('Failed to request in-app review', error);
      return { available: false, attempted: false };
    }
  }

  async openAppStoreReviewPage(): Promise<void> {
    if (Platform.OS !== 'ios') {
      logger.info('App Store review page unavailable on non-iOS platform');
      return;
    }

    try {
      await Linking.openURL(IOS_WRITE_REVIEW_URL);
      logger.info('Opened App Store review page');
      return;
    } catch (error) {
      logger.warn('Failed to open native App Store review page', error);
    }

    try {
      await Linking.openURL(IOS_WEB_REVIEW_URL);
      logger.info('Opened App Store web review page');
    } catch (error) {
      logger.error('Failed to open any App Store review page', error);
      throw error;
    }
  }
}

export const reviewService = new ReviewService();
