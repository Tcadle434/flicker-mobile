import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import { ONBOARDING_ASSETS } from '../onboardingAssets';
import { playSound } from '../../../services/audio/uiSounds';
import { reviewService } from '../../../services/reviews/reviewService';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { logger } from '../../../lib/logger';

const { width: SCREEN_W } = Dimensions.get('window');
const FLICKER_SIZE = SCREEN_W * 0.4;
const STAR_COUNT = 5;
const AUTO_REQUEST_DELAY_MS = 700;

interface Props {
  onNext: () => void;
}

export default function Step16ReviewPrompt({ onNext }: Props) {
  const reviewPromptAttemptedThisSession = useOnboardingStore(
    (s) => s.reviewPromptAttemptedThisSession,
  );
  const markReviewPromptAttempted = useOnboardingStore((s) => s.markReviewPromptAttempted);

  const [isAttemptingReview, setIsAttemptingReview] = useState(false);
  const [hasFinishedInitialAttempt, setHasFinishedInitialAttempt] = useState(
    reviewPromptAttemptedThisSession,
  );
  const [showFallbackCta, setShowFallbackCta] = useState(reviewPromptAttemptedThisSession);

  const attemptedOnMountRef = useRef(reviewPromptAttemptedThisSession);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const suppressAutoRequestRef = useRef(false);

  const clearPendingAutoRequest = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const runReviewRequest = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setIsAttemptingReview(true);

    try {
      await reviewService.requestInAppReview();
    } finally {
      if (!isMountedRef.current) {
        return;
      }

      setIsAttemptingReview(false);
      setHasFinishedInitialAttempt(true);
      setShowFallbackCta(true);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    suppressAutoRequestRef.current = false;

    if (attemptedOnMountRef.current) {
      setHasFinishedInitialAttempt(true);
      setShowFallbackCta(true);

      return () => {
        isMountedRef.current = false;
        suppressAutoRequestRef.current = true;
        clearPendingAutoRequest();
      };
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;

      if (suppressAutoRequestRef.current) {
        return;
      }

      markReviewPromptAttempted();
      void runReviewRequest();
    }, AUTO_REQUEST_DELAY_MS);

    return () => {
      isMountedRef.current = false;
      suppressAutoRequestRef.current = true;
      clearPendingAutoRequest();
    };
  }, [
    clearPendingAutoRequest,
    markReviewPromptAttempted,
    runReviewRequest,
  ]);

  const handleAdvance = useCallback(() => {
    suppressAutoRequestRef.current = true;
    clearPendingAutoRequest();
    playSound('buttonPress');
    onNext();
  }, [clearPendingAutoRequest, onNext]);

  const handleRateOnAppStore = useCallback(() => {
    playSound('buttonPress');
    void reviewService.openAppStoreReviewPage().catch((error) => {
      logger.warn('Failed to open App Store review fallback', error);
    });
  }, []);

  const handleStarPress = useCallback(() => {
    if (isAttemptingReview) {
      return;
    }

    clearPendingAutoRequest();
    if (!reviewPromptAttemptedThisSession) {
      markReviewPromptAttempted();
    }
    playSound('buttonPress');
    void runReviewRequest();
  }, [
    clearPendingAutoRequest,
    isAttemptingReview,
    markReviewPromptAttempted,
    reviewPromptAttemptedThisSession,
    runReviewRequest,
  ]);

  return (
    <ContentScreen backgroundColor="#F5F0EA">
      <View style={styles.header}>
        <Animated.Text entering={FadeInDown.delay(100).duration(500)} style={styles.title}>
          Enjoying Flicker so far?
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(240).duration(500)} style={styles.subtitle}>
          If it already feels helpful, a quick App Store rating really helps.
        </Animated.Text>
      </View>

      <View style={styles.content}>
        <Animated.View entering={FadeIn.delay(220).duration(700)} style={styles.flickerWrap}>
          <Image
            source={ONBOARDING_ASSETS.flickerCalmBase}
            style={styles.flickerImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(380).duration(500)} style={styles.starRow}>
          {Array.from({ length: STAR_COUNT }).map((_, index) => (
            <Pressable
              key={index}
              style={styles.starButton}
              onPress={handleStarPress}
              disabled={isAttemptingReview}
              hitSlop={8}
            >
              <Text style={styles.starText}>★</Text>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(480).duration(500)} style={styles.noteCard}>
          <Text style={styles.noteText}>
            We&apos;ve opened Apple&apos;s review prompt for you. If it didn&apos;t appear, you can
            still rate Flicker on the App Store.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(620).duration(400)}>
        {showFallbackCta && (
          <Pressable
            style={styles.fallbackButton}
            onPress={handleRateOnAppStore}
            disabled={isAttemptingReview}
          >
            <Text style={styles.fallbackButtonText}>Rate on App Store</Text>
          </Pressable>
        )}

        <Pressable
          style={[
            styles.ctaButton,
            !hasFinishedInitialAttempt && styles.ctaButtonDisabled,
          ]}
          onPress={handleAdvance}
          disabled={!hasFinishedInitialAttempt}
        >
          <Text style={styles.ctaText}>
            {isAttemptingReview && !hasFinishedInitialAttempt ? 'Opening…' : 'Continue'}
          </Text>
        </Pressable>

        <Pressable onPress={handleAdvance} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Animated.View>
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 68,
    paddingBottom: 6,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 23,
    textAlign: 'left',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flickerWrap: {
    marginBottom: 14,
  },
  flickerImage: {
    width: FLICKER_SIZE,
    height: FLICKER_SIZE,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  starButton: {
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  starText: {
    color: '#DBA63C',
    fontSize: 34,
    lineHeight: 38,
  },
  noteCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  noteText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
  },
  fallbackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 15,
    marginBottom: 12,
  },
  fallbackButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 16,
  },
  ctaButtonDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    color: '#FAFAFA',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  skipButton: {
    alignSelf: 'center',
    paddingVertical: 14,
  },
  skipText: {
    color: 'rgba(0, 0, 0, 0.4)',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
