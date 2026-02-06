/**
 * TextInput Component
 *
 * Styled text input with label and error handling
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../constants/theme';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  secure?: boolean;
  glass?: boolean;
}

export function TextInput({
  label,
  error,
  containerStyle,
  secure = false,
  glass = false,
  ...props
}: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {!glass && label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          glass && styles.inputGlass,
          isFocused && (glass ? styles.inputGlassFocused : styles.inputFocused),
          error && styles.inputError,
        ]}
      >
        <RNTextInput
          {...props}
          style={[styles.input, props.style]}
          placeholderTextColor={glass ? 'rgba(255, 255, 255, 0.35)' : theme.colors.textTertiary}
          secureTextEntry={secure && !showPassword}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
        />
        {secure && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {glass ? (
              <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
            ) : (
              <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.layout.inputHeight,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  inputGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: theme.borderRadius.xl,
    height: 52,
  },
  inputFocused: {
    borderColor: theme.colors.primary,
  },
  inputGlassFocused: {
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text,
    height: '100%',
  },
  eyeButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.xs,
  },
  eyeText: {
    fontSize: 20,
  },
  toggleText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
  },
  error: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
