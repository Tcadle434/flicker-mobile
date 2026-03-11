/**
 * ContentScreen
 *
 * Layout wrapper for content-type onboarding screens.
 * Dark warm background, centered content area with staggered animations.
 * Used for stats, questions, mode previews, permissions, etc.
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Background color override */
  backgroundColor?: string;
}

export default function ContentScreen({ children, style, backgroundColor }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        backgroundColor ? { backgroundColor } : undefined,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    paddingHorizontal: 24,
  },
});
