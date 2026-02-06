import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
});
