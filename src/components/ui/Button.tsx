/**
 * Button Component
 *
 * Primary UI button with multiple variants and sizes
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../constants/theme';
import type { ButtonVariant, ButtonSize } from '../../types';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${variant}`],
    styles[`text_${size}`],
    disabled && styles.textDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'glass' ? '#FFFFFF' : variant === 'primary' ? theme.colors.background : theme.colors.primary}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: theme.colors.error,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
  },

  // Sizes
  size_sm: {
    height: 40,
    paddingHorizontal: theme.spacing.md,
  },
  size_md: {
    height: theme.layout.inputHeight,
    paddingHorizontal: theme.spacing.lg,
  },
  size_lg: {
    height: theme.layout.buttonHeight,
    paddingHorizontal: theme.spacing.xl,
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
  },

  // Text styles
  text: {
    fontWeight: theme.typography.fontWeight.semibold,
  },
  text_primary: {
    color: theme.colors.background,
  },
  text_secondary: {
    color: theme.colors.text,
  },
  text_ghost: {
    color: theme.colors.primary,
  },
  text_danger: {
    color: theme.colors.text,
  },
  text_glass: {
    color: '#FFFFFF',
  },

  // Text sizes
  text_sm: {
    fontSize: theme.typography.fontSize.sm,
  },
  text_md: {
    fontSize: theme.typography.fontSize.md,
  },
  text_lg: {
    fontSize: theme.typography.fontSize.lg,
  },

  textDisabled: {
    color: theme.colors.textDisabled,
  },
});
