/**
 * Card Component
 *
 * Glassmorphic card container for content
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';
import type { CardProps } from '../../types';

interface CardComponentProps extends CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({
  children,
  glass = false,
  elevated = false,
  padding = 'md',
  style,
}: CardComponentProps) {
  const cardStyles = [
    styles.base,
    glass ? styles.glass : styles.surface,
    elevated && theme.shadows.md,
    { padding: theme.spacing[padding] },
    style,
  ];

  return <View style={cardStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  surface: {
    backgroundColor: theme.colors.surface,
  },
  glass: {
    backgroundColor: theme.glassmorphism.light.backgroundColor,
    borderWidth: theme.glassmorphism.light.borderWidth,
    borderColor: theme.glassmorphism.light.borderColor,
  },
});
