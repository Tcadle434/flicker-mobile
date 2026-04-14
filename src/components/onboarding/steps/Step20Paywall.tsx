/**
 * Step20Paywall
 *
 * High-converting paywall with 7-day free trial.
 * Light tan design (#F5F0EA) matching the onboarding style.
 * Annual plan pre-selected. Replace purchaseService with Superwall when ready.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { purchaseService, type ProductID } from '../../../services/purchases/purchaseService';
import { ONBOARDING_ASSETS } from '../onboardingAssets';
import { playSound } from '../../../services/audio/uiSounds';

const { width: SCREEN_W } = Dimensions.get('window');
const FLICKER_SIZE = SCREEN_W * 0.32;

// Annual savings: (3.99*12 - 19.99) / (3.99*12) = 58%
const PLANS = [
  {
    id: 'flicker_annual_v1' as ProductID,
    label: 'Annual',
    badge: 'BEST VALUE',
    price: '$19.99',
    period: 'per year',
    sub: '$1.67 / week',
    billedAs: 'billed $19.99/year after trial',
    savings: 'Save 58%',
    highlight: true,
  },
  {
    id: 'flicker_monthly_v1' as ProductID,
    label: 'Monthly',
    badge: null,
    price: '$3.99',
    period: 'per month',
    sub: null,
    billedAs: 'billed $3.99/month after trial',
    savings: null,
    highlight: false,
  },
] as const;

const FEATURES = [
  { icon: '\uD83D\uDEAB', text: 'App blocking during every session' },
  { icon: '\uD83D\uDD25', text: 'Reset, Focus & Move modes' },
  { icon: '\u2728', text: 'Earn Light & build your sanctuary' },
];

interface Props { onNext: () => void; }

export default function Step20Paywall({ onNext }: Props) {
  const insets = useSafeAreaInsets();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const [selectedPlan, setSelectedPlan] = useState<ProductID>('flicker_annual_v1');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSubscribe = useCallback(async () => {
    setIsLoading(true);
    playSound('buttonPress');

    const result = await purchaseService.purchase(selectedPlan);

    if (result.success) {
      await completeOnboarding();
      router.replace('/(main)/home');
    } else {
      setIsLoading(false);
      Alert.alert('Purchase Failed', result.error ?? 'Please try again.');
    }
  }, [selectedPlan, completeOnboarding]);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    const result = await purchaseService.restore();
    setIsRestoring(false);

    if (result.success) {
      await completeOnboarding();
      router.replace('/(main)/home');
    } else {
      Alert.alert('Nothing to Restore', 'No active subscription found for this Apple ID.');
    }
  }, [completeOnboarding]);

  const selectedPlanData = PLANS.find((p) => p.id === selectedPlan)!;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
      {/* ── Hero ── */}
      <Animated.View entering={FadeIn.delay(0).duration(500)} style={styles.hero}>
        <View style={styles.trialBadge}>
          <Text style={styles.trialBadgeText}>7-DAY FREE TRIAL</Text>
        </View>
        <Image
          source={ONBOARDING_ASSETS.flickerCalmBase}
          style={styles.flickerImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* ── Headline ── */}
      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.headlineWrap}>
        <Text style={styles.headline}>Start Your Free Trial</Text>
        <Text style={styles.subheadline}>
          Unlock everything. Cancel anytime.
        </Text>
      </Animated.View>

      {/* ── Features ── */}
      <Animated.View entering={FadeInDown.delay(280).duration(500)} style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.icon} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </Animated.View>

      {/* ── Plan Cards ── */}
      <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.plans}>
        {PLANS.map((plan) => {
          const selected = selectedPlan === plan.id;
          return (
            <Pressable
              key={plan.id}
              onPress={() => setSelectedPlan(plan.id)}
              style={[styles.planCard, selected && styles.planCardSelected]}
            >
              {/* Badge */}
              {plan.badge && (
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}
              {/* Selection dot */}
              <View style={styles.planLeft}>
                <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                  {selected && <View style={styles.radioInner} />}
                </View>
                <View>
                  <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>
                    {plan.label}
                  </Text>
                  {plan.savings && (
                    <Text style={styles.planSavings}>{plan.savings}</Text>
                  )}
                </View>
              </View>
              {/* Price */}
              <View style={styles.planRight}>
                <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>
                  {plan.price}
                </Text>
                <Text style={styles.planPeriod}>{plan.period}</Text>
                {plan.sub && (
                  <Text style={styles.planSub}>{plan.sub}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </Animated.View>

      {/* ── CTA ── */}
      <Animated.View entering={FadeInDown.delay(520).duration(500)} style={styles.ctaWrap}>
        <Pressable
          style={[styles.ctaButton, isLoading && styles.ctaButtonLoading]}
          onPress={handleSubscribe}
          disabled={isLoading || isRestoring}
        >
          <Text style={styles.ctaText}>
            {isLoading ? 'Starting…' : 'Start Free Trial'}
          </Text>
        </Pressable>
        <Text style={styles.ctaFineprint}>
          {selectedPlanData.billedAs}. Cancel anytime.
        </Text>
      </Animated.View>

      {/* ── Footer links ── */}
      <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.footer}>
        <Pressable onPress={handleRestore} disabled={isRestoring}>
          <Text style={styles.footerLink}>
            {isRestoring ? 'Restoring…' : 'Restore Purchases'}
          </Text>
        </Pressable>
        <Text style={styles.footerDot}>·</Text>
        <Pressable onPress={() => Linking.openURL('https://example.com/privacy')}>
          <Text style={styles.footerLink}>Privacy</Text>
        </Pressable>
        <Text style={styles.footerDot}>·</Text>
        <Pressable onPress={() => Linking.openURL('https://example.com/terms')}>
          <Text style={styles.footerLink}>Terms</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0EA',
    paddingHorizontal: 24,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 4,
  },
  trialBadge: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 4,
  },
  trialBadgeText: {
    color: '#F5F0EA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  flickerImage: {
    width: FLICKER_SIZE,
    height: FLICKER_SIZE,
  },

  // Headline
  headlineWrap: {
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 16,
  },
  headline: {
    color: '#1A1A1A',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subheadline: {
    color: 'rgba(0, 0, 0, 0.45)',
    fontSize: 15,
    fontWeight: '300',
    textAlign: 'center',
  },

  // Features
  features: {
    gap: 8,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  featureText: {
    color: 'rgba(0, 0, 0, 0.65)',
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },

  // Plan cards
  plans: {
    gap: 10,
    marginBottom: 18,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    position: 'relative',
  },
  planCardSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planBadgeText: {
    color: '#F5F0EA',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#1A1A1A',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1A1A1A',
  },
  planLabel: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 15,
    fontWeight: '500',
  },
  planLabelSelected: {
    color: '#1A1A1A',
    fontWeight: '700',
  },
  planSavings: {
    color: '#27AE60',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  planRight: {
    alignItems: 'flex-end',
  },
  planPrice: {
    color: 'rgba(0, 0, 0, 0.4)',
    fontSize: 18,
    fontWeight: '600',
  },
  planPriceSelected: {
    color: '#1A1A1A',
  },
  planPeriod: {
    color: 'rgba(0, 0, 0, 0.35)',
    fontSize: 11,
    fontWeight: '400',
  },
  planSub: {
    color: '#27AE60',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },

  // CTA
  ctaWrap: {
    gap: 8,
  },
  ctaButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },
  ctaButtonLoading: {
    opacity: 0.5,
  },
  ctaText: {
    color: '#F5F0EA',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  ctaFineprint: {
    color: 'rgba(0, 0, 0, 0.35)',
    fontSize: 12,
    fontWeight: '300',
    textAlign: 'center',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  footerLink: {
    color: 'rgba(0, 0, 0, 0.35)',
    fontSize: 12,
    fontWeight: '400',
  },
  footerDot: {
    color: 'rgba(0, 0, 0, 0.2)',
    fontSize: 12,
  },
});
