import React from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Step20Paywall from '../../src/components/onboarding/steps/Step20Paywall';

export default function ResumePaywallScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Step20Paywall onNext={() => undefined} mode="resume" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0EA',
  },
});
