import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { TextInput as RNTextInput } from 'react-native';
import { useAuthStore } from '../../src/stores';
import { theme } from '../../src/constants/theme';
import { useMoodCycle, buildTitleColorInterpolation } from '../../src/hooks/useMoodCycle';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { signUp, isLoading } = useAuthStore();
  const { colorStep, CYCLE, MOOD_COLORS } = useMoodCycle();

  const animatedTitleColor = useMemo(
    () => buildTitleColorInterpolation(colorStep, CYCLE, MOOD_COLORS),
    [colorStep],
  );

  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    const { error } = await signUp(email, password);

    if (error) {
      Alert.alert('Sign Up Failed', error.message);
    } else {
      router.replace('/(main)/home');
    }
  };

  return (
    <View style={styles.background}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />
        <Text style={styles.brandMark}>Flicker</Text>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Animated.Text style={[styles.title, { color: animatedTitleColor }]}>
              Create account
            </Animated.Text>
            <Text style={styles.subtitle}>
              The world moves fast. Your mind isn't meant to
            </Text>
          </View>

          <View style={styles.form}>
            <RNTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <RNTextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="rgba(255,255,255,0.4)"
              secureTextEntry
              style={styles.input}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <RNTextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor="rgba(255,255,255,0.4)"
              secureTextEntry
              style={styles.input}
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

            <TouchableOpacity
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.7}
              style={styles.createButton}
            >
              <Animated.View
                style={[
                  styles.glassButton,
                  { borderColor: animatedTitleColor },
                  isLoading && styles.glassButtonDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Animated.Text style={[styles.glassButtonText, { color: animatedTitleColor }]}>
                    Create Account
                  </Animated.Text>
                )}
              </Animated.View>
            </TouchableOpacity>

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signin')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.terms}>
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  container: {
    flex: 1,
  },
  brandMark: {
    position: 'absolute',
    top: 60,
    left: theme.spacing.lg,
    fontSize: theme.typography.fontSize.xl,
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'cursive',
    color: theme.colors.textTertiary,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 16,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginBottom: theme.spacing.sm,
    marginTop: -4,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.light,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  createButton: {
    marginTop: theme.spacing.sm,
  },
  glassButton: {
    width: '100%',
    height: theme.layout.buttonHeight,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
  },
  glassButtonDisabled: {
    opacity: 0.5,
  },
  glassButtonText: {
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.lg,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  signInText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textTertiary,
  },
  signInLink: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  terms: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
});
