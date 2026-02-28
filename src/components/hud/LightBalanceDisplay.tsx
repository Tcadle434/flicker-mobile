import React from 'react';
import { View, Text, Image, ImageBackground, StyleSheet } from 'react-native';
import { useCurrencyStore } from '../../stores/currencyStore';
import { HUD_ASSETS } from './hudAssets';

export default function LightBalanceDisplay() {
  const balance = useCurrencyStore((s) => s.balance);

  return (
    <ImageBackground
      source={HUD_ASSETS.balanceBg}
      style={styles.background}
      resizeMode="stretch"
    >
      {HUD_ASSETS.lightCrystal ? (
        <Image
          source={HUD_ASSETS.lightCrystal}
          style={styles.icon}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.fallbackIcon} />
      )}
      <Text style={styles.text}>{balance.toLocaleString()}</Text>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 110,
    height: 42,
    gap: 6,
    paddingHorizontal: 8,
  },
  icon: {
    width: 30,
    height: 30,
    marginTop: -10,
  },
  fallbackIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#5EEAD4',
  },
  text: {
    color: '#3B2A1A',
    fontFamily: 'Toriko',
    marginTop: 4,
    fontSize: 20,
    letterSpacing: 0.5,
  },
});
