import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

export function SessionAurora() {
  const drift = useRef(new Animated.Value(0)).current;
  const driftSlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopFast = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 18000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const loopSlow = Animated.loop(
      Animated.sequence([
        Animated.timing(driftSlow, {
          toValue: 1,
          duration: 26000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(driftSlow, {
          toValue: 0,
          duration: 26000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loopFast.start();
    loopSlow.start();

    return () => {
      loopFast.stop();
      loopSlow.stop();
    };
  }, [drift, driftSlow]);

  const translateX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-40, 40],
  });

  const translateY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [30, -30],
  });

  const slowX = driftSlow.interpolate({
    inputRange: [0, 1],
    outputRange: [50, -50],
  });

  const slowY = driftSlow.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 60],
  });

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.blob,
          styles.blobPrimary,
          { transform: [{ translateX }, { translateY }] },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          styles.blobSecondary,
          { transform: [{ translateX: slowX }, { translateY: slowY }] },
        ]}
      />
      <View style={[styles.blob, styles.blobCore]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0B',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 420,
    opacity: 0.5,
  },
  blobPrimary: {
    top: '15%',
    left: '20%',
    backgroundColor: 'rgba(84, 102, 255, 0.35)',
  },
  blobSecondary: {
    bottom: '10%',
    right: '15%',
    backgroundColor: 'rgba(45, 212, 191, 0.25)',
  },
  blobCore: {
    top: '35%',
    left: '30%',
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
