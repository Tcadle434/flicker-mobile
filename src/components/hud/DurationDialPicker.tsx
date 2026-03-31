import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
} from '@shopify/react-native-skia';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

/* ── constants ─────────────────────────────────────────────── */

const DIAL_SIZE = 220;
const RADIUS = 82;
const STROKE_WIDTH = 8;
const HANDLE_RADIUS = 14;
const HIT_SLOP = 30; // px tolerance around track ring
const TWO_PI = Math.PI * 2;

/* ── types ─────────────────────────────────────────────────── */

export interface DurationDialPickerProps {
  value: number;
  onChange: (minutes: number) => void;
  min?: number;
  max?: number;
  step?: number;
  accent: string;
  mode: 'reset' | 'focus';
}

/* ── worklet helpers ───────────────────────────────────────── */

function clamp(v: number, lo: number, hi: number) {
  'worklet';
  return Math.min(hi, Math.max(lo, v));
}

/** Convert a touch position to a clockwise angle from 12-o'clock (0 – 2PI). */
function touchToClockAngle(x: number, y: number, cx: number, cy: number) {
  'worklet';
  const dx = x - cx;
  const dy = y - cy;
  const mathAngle = Math.atan2(dy, dx);
  // rotate so 12-o'clock (−Y axis) is 0, clockwise positive
  let clockAngle = mathAngle + Math.PI / 2;
  if (clockAngle < 0) clockAngle += TWO_PI;
  return clockAngle;
}

function clockAngleToMinutes(
  angle: number,
  min: number,
  max: number,
  step: number,
) {
  'worklet';
  const raw = min + (angle / TWO_PI) * (max - min);
  const snapped = Math.round((raw - min) / step) * step + min;
  return clamp(snapped, min, max);
}

function minutesToClockAngle(minutes: number, min: number, max: number) {
  'worklet';
  return ((minutes - min) / (max - min)) * TWO_PI;
}

/* ── component ─────────────────────────────────────────────── */

export default function DurationDialPicker({
  value,
  onChange,
  min = 5,
  max = 120,
  step = 5,
  accent,
}: DurationDialPickerProps) {
  const cx = DIAL_SIZE / 2;
  const cy = DIAL_SIZE / 2;

  /* shared values */
  const currentAngle = useSharedValue(minutesToClockAngle(value, min, max));
  const isOnRing = useSharedValue(false);
  const lastSnapped = useSharedValue(value);
  const prevAngle = useSharedValue(minutesToClockAngle(value, min, max));

  /* sync external value changes */
  useEffect(() => {
    const target = minutesToClockAngle(value, min, max);
    currentAngle.value = withTiming(target, { duration: 200 });
    lastSnapped.value = value;
  }, [value, min, max, currentAngle, lastSnapped]);

  /* ── track ring path ─────────────────────────────────────── */

  const trackPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addOval(
      Skia.XYWHRect(
        cx - RADIUS,
        cy - RADIUS,
        RADIUS * 2,
        RADIUS * 2,
      ),
    );
    return path;
  }, [cx, cy]);

  /* ── derived values for arc + handle ─────────────────────── */

  const arcPath = useDerivedValue(() => {
    const sweepDeg = (currentAngle.value / TWO_PI) * 360;
    const path = Skia.Path.Make();
    path.addArc(
      Skia.XYWHRect(cx - RADIUS, cy - RADIUS, RADIUS * 2, RADIUS * 2),
      -90,
      sweepDeg,
    );
    return path;
  });

  const handleX = useDerivedValue(
    () => cx + RADIUS * Math.cos(currentAngle.value - Math.PI / 2),
  );
  const handleY = useDerivedValue(
    () => cy + RADIUS * Math.sin(currentAngle.value - Math.PI / 2),
  );

  /* ── center text (driven by animated reaction) ───────────── */

  const [displayMinutes, setDisplayMinutes] = useState(value);

  useAnimatedReaction(
    () => clockAngleToMinutes(currentAngle.value, min, max, step),
    (curr, prev) => {
      if (curr !== prev) {
        runOnJS(setDisplayMinutes)(curr);
      }
    },
  );

  /* ── haptic callback ─────────────────────────────────────── */

  const hapticFeedback = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  const commitValue = useCallback(
    (minutes: number) => {
      onChange(minutes);
    },
    [onChange],
  );

  /* ── gesture ─────────────────────────────────────────────── */

  const panGesture = Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      const dx = e.x - cx;
      const dy = e.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      isOnRing.value =
        dist > RADIUS - HIT_SLOP && dist < RADIUS + HIT_SLOP;
      if (isOnRing.value) {
        const angle = touchToClockAngle(e.x, e.y, cx, cy);
        prevAngle.value = angle;
      }
    })
    .onUpdate((e) => {
      'worklet';
      if (!isOnRing.value) return;

      const angle = touchToClockAngle(e.x, e.y, cx, cy);

      // wrap-point detection: if the angle jumps more than PI, clamp
      const delta = angle - prevAngle.value;
      if (Math.abs(delta) > Math.PI) {
        // jumped past 12 o'clock — clamp to min or max
        if (delta < 0) {
          // dragging CW past 2PI → 0, push to max
          currentAngle.value = TWO_PI - 0.001;
        } else {
          // dragging CCW past 0 → 2PI, push to min
          currentAngle.value = 0.001;
        }
      } else {
        currentAngle.value = clamp(angle, 0.001, TWO_PI - 0.001);
      }

      prevAngle.value = currentAngle.value;

      const newMin = clockAngleToMinutes(currentAngle.value, min, max, step);
      if (newMin !== lastSnapped.value) {
        lastSnapped.value = newMin;
        runOnJS(hapticFeedback)();
      }
    })
    .onEnd(() => {
      'worklet';
      if (!isOnRing.value) return;

      const finalMin = clockAngleToMinutes(currentAngle.value, min, max, step);
      const snapAngle = minutesToClockAngle(finalMin, min, max);
      currentAngle.value = withTiming(snapAngle, { duration: 120 });
      runOnJS(commitValue)(finalMin);
    });

  /* ── render ──────────────────────────────────────────────── */

  return (
    <View style={styles.root}>
      {/* background glow */}
      <View style={[styles.bgGlow, { backgroundColor: `${accent}14` }]} />

      {/* Skia canvas */}
      <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* track ring */}
        <Path
          path={trackPath}
          color="rgba(59, 42, 26, 0.15)"
          style="stroke"
          strokeWidth={STROKE_WIDTH}
          strokeCap="round"
        />

        {/* active arc */}
        <Path
          path={arcPath}
          color={`${accent}CC`}
          style="stroke"
          strokeWidth={STROKE_WIDTH}
          strokeCap="round"
        />

        {/* handle glow */}
        <Circle cx={handleX} cy={handleY} r={HANDLE_RADIUS + 6} color={`${accent}22`} />

        {/* handle */}
        <Circle cx={handleX} cy={handleY} r={HANDLE_RADIUS} color={accent} />

        {/* handle inner dot */}
        <Group>
          <Circle cx={handleX} cy={handleY} r={5} color="rgba(255,255,255,0.5)" />
        </Group>
      </Canvas>

      {/* center text */}
      <View style={styles.centerContent} pointerEvents="none">
        <Text style={styles.centerNumber}>{displayMinutes}</Text>
        <Text style={styles.centerLabel}>min</Text>
      </View>

      {/* gesture layer */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFill} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignSelf: 'center',
  },
  bgGlow: {
    position: 'absolute',
    width: DIAL_SIZE * 0.7,
    height: DIAL_SIZE * 0.7,
    borderRadius: DIAL_SIZE * 0.35,
    left: DIAL_SIZE * 0.15,
    top: DIAL_SIZE * 0.15,
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNumber: {
    color: '#2E2014',
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: -1,
  },
  centerLabel: {
    color: '#8B7A6A',
    fontSize: 14,
    fontWeight: '600',
    marginTop: -4,
  },
});
