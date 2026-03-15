/**
 * StepCinematicDemo
 *
 * Full-screen cinematic auto-playing product demo.
 * Phase state machine with skip-forward support + subtitles.
 *
 * Phases:
 *   0: MODE_SELECT     — session panel auto-selects Relax → Begin
 *   1: SESSION_WARP    — panel flies up, flash, zen garden fades in
 *   2: SESSION_ACTIVE   — zen garden + timer + ambient text
 *   3: SESSION_COMPLETE — "Reset complete." + reward pill
 *   4: SANCTUARY        — shop opens over tent, closes, furniture drops
 *   5: CTA              — "Build my ritual" button (auto-advances after 6s)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import ZenGardenScene from '../../world/ZenGardenScene';
import TentInteriorScene from '../../world/TentInteriorScene';
import DemoSessionPanel from '../demo/DemoSessionPanel';
import DemoCompleteOverlay from '../demo/DemoCompleteOverlay';
import DemoFurniturePlacement from '../demo/DemoFurniturePlacement';
import DemoShopOverlay from '../demo/DemoShopOverlay';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SUBTITLES: Record<number, string> = {
  0: 'Three modes. One ritual.',
  2: 'Your phone goes quiet. You stay present.',
  3: 'Every minute earns light.',
  4: 'Spend light to make your sanctuary yours.',
};

// ── Helpers ──

function snap(sv: SharedValue<number>, val: number) {
  cancelAnimation(sv);
  sv.value = val;
}

interface Props {
  onNext: () => void;
}

export default function StepCinematicDemo({ onNext }: Props) {
  const phaseRef = useRef(-1);
  const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const zenReadyRef = useRef(false);
  const zenReadyResolveRef = useRef<(() => void) | null>(null);
  const [showTent, setShowTent] = useState(false);
  const [phase, setPhase] = useState(-1);
  const [subtitleText, setSubtitleText] = useState('');

  // ── All shared values ──

  // Panel (Phase 0)
  const panelOpacity = useSharedValue(0);
  const panelTranslateY = useSharedValue(0);
  const relaxHighlight = useSharedValue(0);
  const durationsOpacity = useSharedValue(0);
  const dur10Highlight = useSharedValue(0);
  const beginOpacity = useSharedValue(0);
  const beginScale = useSharedValue(1);

  // Flash
  const flashOpacity = useSharedValue(0);

  // Zen Garden
  const zenOpacity = useSharedValue(0);

  // Timer + HUD (Phase 2)
  const timerOpacity = useSharedValue(0);
  const centerTextOpacity = useSharedValue(0);
  const welcomeBackOpacity = useSharedValue(0);

  // Complete overlay (Phase 3)
  const completeOverlayOpacity = useSharedValue(0);
  const completeTitleOpacity = useSharedValue(0);
  const completeTitleTranslateY = useSharedValue(20);
  const completeMessageOpacity = useSharedValue(0);
  const completeRewardOpacity = useSharedValue(0);
  const completeRewardScale = useSharedValue(0.8);

  // Tent (Phase 4)
  const tentOpacity = useSharedValue(0);

  // Shop overlay (Phase 4)
  const shopOpacity = useSharedValue(0);
  const shopTranslateY = useSharedValue(0);

  // Furniture (Phase 4)
  const item0TranslateY = useSharedValue(-120);
  const item0Opacity = useSharedValue(0);
  const item1TranslateY = useSharedValue(-120);
  const item1Opacity = useSharedValue(0);
  const item2TranslateY = useSharedValue(-120);
  const item2Opacity = useSharedValue(0);

  // CTA (Phase 5)
  const ctaOpacity = useSharedValue(0);
  const ctaTranslateY = useSharedValue(40);

  // Subtitle
  const subtitleOpacity = useSharedValue(0);

  // Skip arrow
  const skipOpacity = useSharedValue(0);

  // ── Timer management ──

  const clearTimers = useCallback(() => {
    pendingTimers.current.forEach(clearTimeout);
    pendingTimers.current = [];
  }, []);

  const schedule = useCallback((delay: number, fn: () => void) => {
    pendingTimers.current.push(setTimeout(fn, delay));
  }, []);

  // ── Subtitle helper ──

  const showSubtitle = useCallback((text: string, delay = 0) => {
    if (delay > 0) {
      schedule(delay, () => {
        setSubtitleText(text);
        subtitleOpacity.value = withTiming(1, { duration: 400 });
      });
    } else {
      setSubtitleText(text);
      subtitleOpacity.value = withTiming(1, { duration: 400 });
    }
  }, []);

  const hideSubtitle = useCallback(() => {
    subtitleOpacity.value = withTiming(0, { duration: 300 });
  }, []);

  // ── Zen garden ready ──

  const handleZenReady = useCallback(() => {
    zenReadyRef.current = true;
    zenReadyResolveRef.current?.();
  }, []);

  const waitForZenReady = useCallback((): Promise<void> => {
    if (zenReadyRef.current) return Promise.resolve();
    return new Promise((resolve) => {
      zenReadyResolveRef.current = resolve;
    });
  }, []);

  // ── Tent ready ──

  const handleTentReady = useCallback(() => {
    tentOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  // ── Phase snap functions ──

  const snapPhase0 = useCallback(() => {
    snap(panelOpacity, 0);
    snap(panelTranslateY, -SCREEN_H);
    snap(relaxHighlight, 1);
    snap(durationsOpacity, 1);
    snap(dur10Highlight, 1);
    snap(beginOpacity, 1);
    snap(beginScale, 1);
    snap(flashOpacity, 0);
    snap(subtitleOpacity, 0);
  }, []);

  const snapPhase1 = useCallback(() => {
    snap(panelOpacity, 0);
    snap(panelTranslateY, -SCREEN_H);
    snap(flashOpacity, 0);
    snap(zenOpacity, 1);
    snap(subtitleOpacity, 0);
  }, []);

  const snapPhase2 = useCallback(() => {
    snap(zenOpacity, 1);
    snap(timerOpacity, 0);
    snap(centerTextOpacity, 0);
    snap(welcomeBackOpacity, 0);
    snap(subtitleOpacity, 0);
  }, []);

  const snapPhase3 = useCallback(() => {
    snap(zenOpacity, 0);
    snap(timerOpacity, 0);
    snap(welcomeBackOpacity, 0);
    snap(completeOverlayOpacity, 0);
    snap(completeTitleOpacity, 0);
    snap(completeTitleTranslateY, 0);
    snap(completeMessageOpacity, 0);
    snap(completeRewardOpacity, 0);
    snap(completeRewardScale, 1);
    snap(subtitleOpacity, 0);
  }, []);

  const snapPhase4 = useCallback(() => {
    snap(completeOverlayOpacity, 0);
    snap(tentOpacity, 1);
    snap(shopOpacity, 0);
    snap(shopTranslateY, 100);
    snap(item0TranslateY, 0);
    snap(item0Opacity, 1);
    snap(item1TranslateY, 0);
    snap(item1Opacity, 1);
    snap(item2TranslateY, 0);
    snap(item2Opacity, 1);
    snap(subtitleOpacity, 0);
  }, []);

  // ── Phase enter functions ──

  const enterPhase0 = useCallback(() => {
    clearTimers();
    phaseRef.current = 0;
    setPhase(0);

    // Panel fades in
    panelOpacity.value = withTiming(1, { duration: 500 });

    // Subtitle
    showSubtitle(SUBTITLES[0], 300);

    // 0.8s: highlight Relax
    schedule(800, () => {
      relaxHighlight.value = withTiming(1, { duration: 300 });
    });

    // 1.5s: durations + 10 min
    schedule(1500, () => {
      durationsOpacity.value = withTiming(1, { duration: 300 });
      dur10Highlight.value = withTiming(1, { duration: 300 });
    });

    // 2.5s: begin button
    schedule(2500, () => {
      beginOpacity.value = withTiming(1, { duration: 300 });
    });

    // 3.2s: begin press animation
    schedule(3200, () => {
      beginScale.value = withSequence(
        withTiming(0.93, { duration: 120 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
      hideSubtitle();
    });

    // 3.5s: auto-advance
    schedule(3500, () => enterPhase1());
  }, []);

  const enterPhase1 = useCallback(async () => {
    clearTimers();
    phaseRef.current = 1;
    setPhase(1);

    await waitForZenReady();
    if (phaseRef.current !== 1) return;

    // Flash
    flashOpacity.value = withSequence(
      withTiming(0.6, { duration: 200 }),
      withTiming(0, { duration: 200 }),
    );

    // Panel flies up
    panelTranslateY.value = withTiming(-SCREEN_H, { duration: 400, easing: Easing.in(Easing.cubic) });
    panelOpacity.value = withDelay(300, withTiming(0, { duration: 100 }));

    // Zen garden fades in
    zenOpacity.value = withDelay(200, withTiming(1, { duration: 1000 }));

    // Auto-advance
    schedule(1200, () => enterPhase2());
  }, []);

  const enterPhase2 = useCallback(() => {
    clearTimers();
    phaseRef.current = 2;
    setPhase(2);

    // Timer + center text
    timerOpacity.value = withTiming(0.5, { duration: 500 });
    centerTextOpacity.value = withTiming(1, { duration: 500 });

    // Subtitle
    showSubtitle(SUBTITLES[2], 500);

    // 2s: center text fades
    schedule(2000, () => {
      centerTextOpacity.value = withTiming(0, { duration: 400 });
    });

    // 3s: welcome back
    schedule(3000, () => {
      welcomeBackOpacity.value = withTiming(1, { duration: 500 });
      hideSubtitle();
    });

    // 4s: auto-advance
    schedule(4000, () => enterPhase3());
  }, []);

  const enterPhase3 = useCallback(() => {
    clearTimers();
    phaseRef.current = 3;
    setPhase(3);

    // Zen fades out
    zenOpacity.value = withTiming(0, { duration: 800 });
    timerOpacity.value = withTiming(0, { duration: 400 });
    welcomeBackOpacity.value = withTiming(0, { duration: 400 });

    // Complete overlay
    schedule(500, () => {
      completeOverlayOpacity.value = withTiming(1, { duration: 500 });
      completeTitleOpacity.value = withTiming(1, { duration: 500 });
      completeTitleTranslateY.value = withSpring(0, { damping: 20, stiffness: 150 });
    });

    // Subtitle
    showSubtitle(SUBTITLES[3], 800);

    // Message
    schedule(1200, () => {
      completeMessageOpacity.value = withTiming(1, { duration: 500 });
    });

    // Reward pill + pulse
    schedule(1800, () => {
      completeRewardOpacity.value = withTiming(1, { duration: 500 });
      completeRewardScale.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(1.08, { duration: 200 }),
        withSpring(1, { damping: 12, stiffness: 200 }),
      );
    });

    // Auto-advance
    schedule(3500, () => {
      hideSubtitle();
      enterPhase4();
    });
  }, []);

  const enterPhase4 = useCallback(() => {
    clearTimers();
    phaseRef.current = 4;
    setPhase(4);

    // Complete fades out
    completeOverlayOpacity.value = withTiming(0, { duration: 800 });

    // Mount tent + show shop immediately on top
    setShowTent(true);
    shopOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));

    // Subtitle
    showSubtitle(SUBTITLES[4], 1500);

    // 3s: shop slides down + fades out
    schedule(3000, () => {
      shopTranslateY.value = withTiming(100, { duration: 600, easing: Easing.in(Easing.cubic) });
      shopOpacity.value = withTiming(0, { duration: 600 });
      hideSubtitle();
    });

    // 4s: furniture drops (staggered)
    schedule(4000, () => {
      item0Opacity.value = withTiming(1, { duration: 200 });
      item0TranslateY.value = withSpring(0, { damping: 10, stiffness: 140 });
    });

    schedule(4800, () => {
      item1Opacity.value = withTiming(1, { duration: 200 });
      item1TranslateY.value = withSpring(0, { damping: 10, stiffness: 140 });
    });

    schedule(5600, () => {
      item2Opacity.value = withTiming(1, { duration: 200 });
      item2TranslateY.value = withSpring(0, { damping: 10, stiffness: 140 });
    });

    // Auto-advance
    schedule(6500, () => enterPhase5());
  }, []);

  const enterPhase5 = useCallback(() => {
    clearTimers();
    phaseRef.current = 5;
    setPhase(5);

    // Hide skip arrow
    skipOpacity.value = withTiming(0, { duration: 200 });

    // CTA fades up
    ctaOpacity.value = withTiming(1, { duration: 500 });
    ctaTranslateY.value = withSpring(0, { damping: 16, stiffness: 120 });

    // Auto-advance after 6s if user doesn't tap
    schedule(6000, () => {
      onNext();
    });
  }, [onNext]);

  // ── Skip handler ──

  const handleSkip = useCallback(() => {
    const current = phaseRef.current;
    if (current >= 5) {
      onNext();
      return;
    }

    switch (current) {
      case 0: snapPhase0(); break;
      case 1: snapPhase1(); break;
      case 2: snapPhase2(); break;
      case 3: snapPhase3(); break;
      case 4: snapPhase4(); break;
    }

    const next = current + 1;
    switch (next) {
      case 1: enterPhase1(); break;
      case 2: enterPhase2(); break;
      case 3: enterPhase3(); break;
      case 4: enterPhase4(); break;
      case 5: enterPhase5(); break;
    }
  }, [onNext]);

  // ── Mount: start Phase 0 ──

  useEffect(() => {
    const t = setTimeout(() => {
      enterPhase0();
      skipOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
    }, 400);

    return () => {
      clearTimeout(t);
      clearTimers();
    };
  }, []);

  // ── Animated styles ──

  const zenStyle = useAnimatedStyle(() => ({ opacity: zenOpacity.value }));
  const tentStyle = useAnimatedStyle(() => ({ opacity: tentOpacity.value }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));
  const timerStyle = useAnimatedStyle(() => ({ opacity: timerOpacity.value }));
  const centerTextStyle = useAnimatedStyle(() => ({ opacity: centerTextOpacity.value }));
  const welcomeBackStyle = useAnimatedStyle(() => ({ opacity: welcomeBackOpacity.value }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const skipStyle = useAnimatedStyle(() => ({ opacity: skipOpacity.value }));

  const ctaStyle = useAnimatedStyle(() => ({
    opacity: ctaOpacity.value,
    transform: [{ translateY: ctaTranslateY.value }],
  }));

  return (
    <View style={styles.root}>
      {/* Layer 0: Zen Garden Scene */}
      <Animated.View style={[StyleSheet.absoluteFill, zenStyle]} pointerEvents="none">
        <ZenGardenScene onReady={handleZenReady} />
      </Animated.View>

      {/* Layer 1: Tent Interior Scene */}
      {showTent && (
        <Animated.View style={[StyleSheet.absoluteFill, tentStyle]} pointerEvents="none">
          <TentInteriorScene onReady={handleTentReady} />
        </Animated.View>
      )}

      {/* Layer 2: All RN overlays */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Session Panel (Phase 0) */}
        <DemoSessionPanel
          panelOpacity={panelOpacity}
          panelTranslateY={panelTranslateY}
          relaxHighlight={relaxHighlight}
          durationsOpacity={durationsOpacity}
          dur10Highlight={dur10Highlight}
          beginOpacity={beginOpacity}
          beginScale={beginScale}
        />

        {/* White flash */}
        <Animated.View style={[styles.flash, flashStyle]} pointerEvents="none" />

        {/* Timer HUD (Phase 2) */}
        <Animated.View style={[styles.timerBar, timerStyle]} pointerEvents="none">
          <Text style={styles.timerText}>09:58</Text>
        </Animated.View>

        {/* Center text (Phase 2) */}
        <Animated.View style={[styles.centerTextWrap, centerTextStyle]} pointerEvents="none">
          <Text style={styles.centerText}>Entering your mental reset...</Text>
        </Animated.View>

        {/* Welcome back text (Phase 2) */}
        <Animated.View style={[styles.centerTextWrap, welcomeBackStyle]} pointerEvents="none">
          <Text style={styles.welcomeBackText}>Welcome back.</Text>
        </Animated.View>

        {/* Complete overlay (Phase 3) */}
        <DemoCompleteOverlay
          overlayOpacity={completeOverlayOpacity}
          titleOpacity={completeTitleOpacity}
          titleTranslateY={completeTitleTranslateY}
          messageOpacity={completeMessageOpacity}
          rewardOpacity={completeRewardOpacity}
          rewardScale={completeRewardScale}
        />

        {/* Shop overlay (Phase 4) */}
        {showTent && (
          <DemoShopOverlay
            shopOpacity={shopOpacity}
            shopTranslateY={shopTranslateY}
          />
        )}

        {/* Furniture drops (Phase 4) */}
        {showTent && (
          <DemoFurniturePlacement
            item0TranslateY={item0TranslateY}
            item0Opacity={item0Opacity}
            item1TranslateY={item1TranslateY}
            item1Opacity={item1Opacity}
            item2TranslateY={item2TranslateY}
            item2Opacity={item2Opacity}
          />
        )}

        {/* Subtitle bar */}
        <Animated.View style={[styles.subtitleWrap, subtitleStyle]} pointerEvents="none">
          <Text style={styles.subtitleText}>{subtitleText}</Text>
        </Animated.View>

        {/* CTA (Phase 5) */}
        <Animated.View style={[styles.ctaWrap, ctaStyle]}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={onNext}
            activeOpacity={0.7}
          >
            <Text style={styles.ctaText}>Build my ritual</Text>
          </TouchableOpacity>
          <Text style={styles.ctaSubtext}>
            Protected time. Real rewards. Your space.
          </Text>
        </Animated.View>

        {/* Skip forward arrow */}
        {phase >= 0 && phase < 5 && (
          <Animated.View style={[styles.skipWrap, skipStyle]}>
            <Pressable onPress={handleSkip} style={styles.skipButton} hitSlop={12}>
              <Text style={styles.skipArrow}>›</Text>
            </Pressable>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  timerBar: {
    position: 'absolute',
    top: 70,
    width: '100%',
    alignItems: 'center',
  },
  timerText: {
    color: '#FAFAFA',
    fontSize: 32,
    fontWeight: '200',
    letterSpacing: 2,
  },
  centerTextWrap: {
    position: 'absolute',
    top: SCREEN_H * 0.42,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  centerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '300',
    fontStyle: 'italic',
  },
  welcomeBackText: {
    color: '#FAFAFA',
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  subtitleWrap: {
    position: 'absolute',
    bottom: 130,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  ctaWrap: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(125,211,252,0.15)',
    borderWidth: 1,
    borderColor: '#7DD3FC',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ctaText: {
    color: '#7DD3FC',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaSubtext: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
  },
  skipWrap: {
    position: 'absolute',
    bottom: 70,
    right: 24,
  },
  skipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipArrow: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
    marginLeft: 2,
  },
});
