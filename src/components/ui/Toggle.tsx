/**
 * Toggle Component
 *
 * Switch toggle with label
 */

import React from 'react';
import { View, Text, Switch, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Toggle({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  style,
}: ToggleProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.textContainer}>
        {label && <Text style={styles.label}>{label}</Text>}
        {description && <Text style={styles.description}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{
          false: theme.colors.border,
          true: theme.colors.primary,
        }}
        thumbColor={value ? theme.colors.text : theme.colors.textSecondary}
        ios_backgroundColor={theme.colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
