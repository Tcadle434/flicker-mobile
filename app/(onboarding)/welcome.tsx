import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WelcomePlaceholder() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Onboarding — Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '300',
  },
});
