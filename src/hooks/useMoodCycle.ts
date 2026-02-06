import { useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import type { MoodState } from '../constants/moodThemes';

/**
 * Cycles through mood states with crossfade animations for auth screens.
 *
 * Sequence: neutral → calm → neutral → overwhelmed → (repeat)
 * Each state holds for 3s, crossfade takes 800ms.
 */

const CYCLE: MoodState[] = ['neutral', 'calm', 'neutral', 'overwhelmed'];
const HOLD_MS = 3000;
const FADE_MS = 800;

const MOOD_COLORS: Record<MoodState, string> = {
  neutral: '#E8E8ED',
  calm: '#7DD3FC',
  overwhelmed: '#F0A0A0',
};

export function useMoodCycle() {
  const stepRef = useRef(0);

  // Opacity per avatar image (native driver)
  const neutralOpacity = useRef(new Animated.Value(1)).current;
  const calmOpacity = useRef(new Animated.Value(0)).current;
  const overwhelmedOpacity = useRef(new Animated.Value(0)).current;

  // Monotonically increasing step counter for color interpolation (non-native)
  const colorStep = useRef(new Animated.Value(0)).current;

  const opacityFor: Record<MoodState, Animated.Value> = {
    neutral: neutralOpacity,
    calm: calmOpacity,
    overwhelmed: overwhelmedOpacity,
  };

  const advance = useCallback(() => {
    stepRef.current += 1;
    const target = CYCLE[stepRef.current % CYCLE.length];
    const allMoods: MoodState[] = ['neutral', 'calm', 'overwhelmed'];

    // Crossfade avatar opacities
    const anims = allMoods.map((m) =>
      Animated.timing(opacityFor[m], {
        toValue: m === target ? 1 : 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }),
    );

    // Animate color step (non-native for color interpolation)
    anims.push(
      Animated.timing(colorStep, {
        toValue: stepRef.current,
        duration: FADE_MS,
        useNativeDriver: false,
      }),
    );

    Animated.parallel(anims).start();
  }, []);

  useEffect(() => {
    const timer = setInterval(advance, HOLD_MS);
    return () => clearInterval(timer);
  }, [advance]);

  return {
    neutralOpacity,
    calmOpacity,
    overwhelmedOpacity,
    colorStep,
    CYCLE,
    MOOD_COLORS,
  };
}

/**
 * Build a color interpolation from the colorStep value.
 * Call this in the component to get the animated title color.
 * We pre-build enough steps to cover ~60 cycles (240 steps).
 */
export function buildTitleColorInterpolation(
  colorStep: Animated.Value,
  cycle: MoodState[],
  colors: Record<MoodState, string>,
  steps = 240,
) {
  const inputRange: number[] = [];
  const outputRange: string[] = [];
  for (let i = 0; i <= steps; i++) {
    inputRange.push(i);
    outputRange.push(colors[cycle[i % cycle.length]]);
  }
  return colorStep.interpolate({ inputRange, outputRange });
}
