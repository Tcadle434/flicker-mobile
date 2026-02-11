import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import {
  Canvas,
  Circle,
  RadialGradient,
  vec,
  Shadow,
} from '@shopify/react-native-skia';
import { useMoodTheme } from '../../hooks/useMoodTheme';
import { useStreakStore } from '../../stores/streakStore';
import { theme } from '../../constants/theme';

const DOT_SIZE = 8;
const DOT_GAP = 10;
const DOT_COUNT = 7;
const CANVAS_W = DOT_COUNT * DOT_SIZE + (DOT_COUNT - 1) * DOT_GAP + 24;
const CANVAS_H = DOT_SIZE + 20;

function StreakFlame() {
  const flicker = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flickerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flicker, {
          toValue: 1,
          duration: 400 + Math.random() * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(flicker, {
          toValue: 0,
          duration: 350 + Math.random() * 200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const swayLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(sway, {
          toValue: -1,
          duration: 600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    flickerLoop.start();
    swayLoop.start();

    return () => {
      flickerLoop.stop();
      swayLoop.stop();
    };
  }, [flicker, sway]);

  const opacity = flicker.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const translateY = sway.interpolate({
    inputRange: [-1, 1],
    outputRange: [0.5, -0.5],
  });

  return (
    <Animated.Text
      style={[
        styles.flame,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      🔥
    </Animated.Text>
  );
}

export function StreakDisplay() {
  const moodTheme = useMoodTheme();
  const { weeklyMarks, overallStreak } = useStreakStore();

  return (
    <View style={styles.container}>
      <Canvas style={{ width: CANVAS_W, height: CANVAS_H }}>
        {weeklyMarks.map((filled, i) => {
          const cx = 12 + i * (DOT_SIZE + DOT_GAP) + DOT_SIZE / 2;
          const cy = CANVAS_H / 2;
          const r = DOT_SIZE / 2;

          if (filled) {
            return (
              <React.Fragment key={i}>
                <Circle cx={cx} cy={cy} r={r + 4} opacity={0.25}>
                  <RadialGradient
                    c={vec(cx, cy)}
                    r={r + 4}
                    colors={[`${moodTheme.primary}60`, `${moodTheme.primary}00`]}
                  />
                </Circle>
                <Circle cx={cx} cy={cy} r={r} color={moodTheme.streakFill}>
                  <Shadow dx={0} dy={0} blur={6} color={`${moodTheme.primary}90`} />
                </Circle>
              </React.Fragment>
            );
          }

          return (
            <Circle
              key={i}
              cx={cx}
              cy={cy}
              r={r - 0.5}
              style="stroke"
              strokeWidth={1}
              color="rgba(255,255,255,0.15)"
            />
          );
        })}
      </Canvas>
      {overallStreak > 0 && (
        <View style={styles.streakBadge}>
          <StreakFlame />
          <Text style={[styles.streakCount, { color: moodTheme.primary }]}>
            {overallStreak}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 2,
  },
  flame: {
    fontSize: 10,
  },
  streakCount: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.light,
    marginLeft: 1,
    opacity: 0.6,
  },
});
