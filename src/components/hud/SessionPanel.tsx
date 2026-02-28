import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { config } from '../../constants/config';
import PixelButton from './PixelButton';
import { HUD_ASSETS } from './hudAssets';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_TOP = SCREEN_HEIGHT * 0.35;
const DISMISS_THRESHOLD = 100;

type SessionMode = 'reset' | 'focus' | 'move';

const MODE_DISPLAY: Record<SessionMode, string> = {
  reset: 'Relax',
  focus: 'Focus',
  move: 'Exercise',
};

const MODE_COLORS: Record<SessionMode, string> = {
  reset: '#7DD3FC',
  focus: '#5EEAD4',
  move: '#34D399',
};

interface SessionPanelProps {
  visible: boolean;
  onClose: () => void;
}

export default function SessionPanel({ visible, onClose }: SessionPanelProps) {
  const router = useRouter();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const [selectedMode, setSelectedMode] = useState<SessionMode>('reset');
  const [selectedDuration, setSelectedDuration] = useState<number>(
    config.modes.durations.reset.find((d) => d >= 1) ?? 3,
  );

  // Open / close animation
  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(PANEL_TOP, { damping: 18, stiffness: 140 });
      backdropOpacity.value = withTiming(0.6, { duration: 300 });
    } else {
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [visible]);

  // Reset duration when mode changes
  const handleModeChange = (mode: SessionMode) => {
    setSelectedMode(mode);
    const durations = config.modes.durations[mode].filter((d) => d >= 1);
    setSelectedDuration(durations[0] ?? 5);
  };

  const handleBegin = () => {
    onClose();
    if (selectedMode === 'reset') {
      router.push(`/(session)/reset?duration=${selectedDuration}`);
    } else {
      router.push(`/(session)/run?mode=${selectedMode}&duration=${selectedDuration}`);
    }
  };

  const dismiss = () => {
    onClose();
  };

  // Swipe-down-to-dismiss
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = PANEL_TOP + e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_THRESHOLD) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 250 });
        backdropOpacity.value = withTiming(0, { duration: 250 });
        runOnJS(dismiss)();
      } else {
        translateY.value = withSpring(PANEL_TOP, { damping: 18, stiffness: 140 });
      }
    });

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  const durations = config.modes.durations[selectedMode].filter((d) => d >= 1);
  const accent = MODE_COLORS[selectedMode];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      {/* Panel */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.panel, panelStyle]}>
          {/* Drag handle */}
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>

          <Text style={styles.title}>Start Session</Text>

          {/* Mode selector */}
          <View style={styles.modeRow}>
            {(config.modes.available as readonly SessionMode[]).map((mode) => {
              const active = mode === selectedMode;
              const color = MODE_COLORS[mode];
              return (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeCard,
                    active && { borderColor: color, backgroundColor: `${color}10` },
                  ]}
                  onPress={() => handleModeChange(mode)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modeLabel, active && { color }]}>
                    {MODE_DISPLAY[mode]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Duration picker */}
          <View style={styles.durationRow}>
            {durations.map((d) => {
              const active = d === selectedDuration;
              const label = d >= 60 ? `${d / 60} hr` : `${d} min`;
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.durationChip,
                    active && { backgroundColor: accent },
                  ]}
                  onPress={() => setSelectedDuration(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.durationText, active && styles.durationTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Begin button */}
          <View style={styles.beginRow}>
            <PixelButton
              imageSource={HUD_ASSETS.begin}
              label="Begin"
              fallbackLabel="Begin"
              width={160}
              height={56}
              onPress={handleBegin}
              style={{ borderColor: accent, borderWidth: HUD_ASSETS.begin ? 0 : 1.5, borderRadius: 10 }}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT,
    backgroundColor: '#141416',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '300',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 24,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  modeCard: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  modeLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  durationText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  durationTextActive: {
    color: '#0A0A0B',
    fontWeight: '700',
  },
  beginRow: {
    alignItems: 'center',
  },
});
