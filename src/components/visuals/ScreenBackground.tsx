import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { MoodState } from '../../constants/moodThemes';
import { AtmosphericBackground } from './AtmosphericBackground';

interface ScreenBackgroundProps {
  children: ReactNode;
  mood: MoodState;
  intensity?: number;
}

export function ScreenBackground({
  children,
  mood,
  intensity,
}: ScreenBackgroundProps) {
  return (
    <View style={styles.root}>
      <AtmosphericBackground mood={mood} intensity={intensity} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
