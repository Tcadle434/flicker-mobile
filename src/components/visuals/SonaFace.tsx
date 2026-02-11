import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';

export type SonaMood = 'calm' | 'neutral' | 'anxious';

interface SonaFaceProps {
  size: number;
  mood: SonaMood;
  style?: ViewStyle;
}

const MOOD_IMAGES: Record<SonaMood, ReturnType<typeof require>> = {
  calm: require('../../../assets/sona_calm_transparent.png'),
  neutral: require('../../../assets/sona_neutral_transparent.png'),
  anxious: require('../../../assets/sona_overwhelmed_transparent.png'),
};

export function SonaFace({ size, mood, style }: SonaFaceProps) {
  const bob = useRef(new Animated.Value(0)).current;
  const gaze = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const jitter = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  // Bob animation - gentle vertical floating
  useEffect(() => {
    const bobDuration = mood === 'calm' ? 3200 : mood === 'neutral' ? 2800 : 2200;
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: bobDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: bobDuration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    bobLoop.start();

    return () => {
      bobLoop.stop();
    };
  }, [bob, mood]);

  // Gaze drift animation - subtle movement
  useEffect(() => {
    let active = true;
    let gazeTimer: ReturnType<typeof setTimeout> | null = null;

    const drift = () => {
      if (!active) return;
      const amplitude = mood === 'anxious' ? 10 : mood === 'neutral' ? 8 : 6;
      const nextX = (Math.random() * 10 - 5) * (amplitude / 6);
      const nextY = (Math.random() * 6 - 3) * (amplitude / 6);
      const duration = mood === 'anxious' ? 650 : mood === 'neutral' ? 850 : 1100;
      const pause = mood === 'anxious' ? 300 : mood === 'neutral' ? 500 : 750;
      Animated.timing(gaze, {
        toValue: { x: nextX, y: nextY },
        duration,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        gazeTimer = setTimeout(drift, pause + Math.random() * 800);
      });
    };

    drift();

    return () => {
      active = false;
      if (gazeTimer) clearTimeout(gazeTimer);
      gaze.setValue({ x: 0, y: 0 });
    };
  }, [gaze, mood]);

  // Jitter animation - anxious mood only
  useEffect(() => {
    let active = true;

    if (mood !== 'anxious') {
      jitter.setValue({ x: 0, y: 0 });
      return () => {
        active = false;
      };
    }

    const jitterStep = () => {
      if (!active) return;
      Animated.timing(jitter, {
        toValue: {
          x: Math.random() * 3 - 1.5,
          y: Math.random() * 3 - 1.5,
        },
        duration: 140,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => jitterStep());
    };

    jitterStep();

    return () => {
      active = false;
      jitter.setValue({ x: 0, y: 0 });
    };
  }, [jitter, mood]);

  const bobTranslate = bob.interpolate({
    inputRange: [0, 1],
    outputRange: [6, -6],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          width: size,
          height: size,
          transform: [
            { translateY: bobTranslate },
            { translateX: jitter.x },
            { translateY: jitter.y },
          ],
        },
      ]}
    >
      <Animated.Image
        source={MOOD_IMAGES[mood]}
        resizeMode="contain"
        style={[
          styles.faceImage,
          {
            transform: [
              { translateX: gaze.x },
              { translateY: gaze.y },
            ],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceImage: {
    width: '100%',
    height: '100%',
  },
});
