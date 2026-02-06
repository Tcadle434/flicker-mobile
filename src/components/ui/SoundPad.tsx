import React, { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import { useSoundPadStore } from '../../stores/soundPadStore';
import { useMoodTheme } from '../../hooks/useMoodTheme';
import { theme } from '../../constants/theme';
import NativeAudioEngine from '../../services/audio/nativeAudioModule';

const PAD_SIZE = 260;
const CURSOR_SIZE = 40;
const DEBOUNCE_MS = 60;

export function SoundPad() {
  const moodTheme = useMoodTheme();
  const setPosition = useSoundPadStore((s) => s.setPosition);
  const lastUpdateRef = useRef(0);

  const applyAudioFromPosition = useCallback((nX: number, nY: number) => {
    // nX: -1 (warm) to 1 (bright)
    // nY: -1 (calm/dense) to 1 (clear/sparse)

    // X-axis: filter cutoff + reverb mix
    const normalizedX = (nX + 1) / 2; // 0 to 1
    const filterCutoff = 2000 + normalizedX * 10000;
    const reverbMix = 50 - normalizedX * 40;

    // Y-axis: layer volumes + reverb room
    const normalizedY = (nY + 1) / 2; // 0 (dense) to 1 (sparse)
    const natureVolume = 0.6 - normalizedY * 0.4;
    const ambientVolume = 0.8 - normalizedY * 0.3;
    const melodyVolume = 0.15 + normalizedY * 0.25;
    const reverbRoom = 0.7 - normalizedY * 0.4;

    NativeAudioEngine.setFilterCutoff(filterCutoff).catch(() => {});
    NativeAudioEngine.setReverbWetDryMix(reverbMix).catch(() => {});
    NativeAudioEngine.setReverbRoomSize(reverbRoom).catch(() => {});
    NativeAudioEngine.setLayerVolume('nature', natureVolume, 100).catch(() => {});
    NativeAudioEngine.setLayerVolume('ambient', ambientVolume, 100).catch(() => {});
    NativeAudioEngine.setLayerVolume('melody', melodyVolume, 100).catch(() => {});
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Enable effects on pad open
        NativeAudioEngine.setFilterEnabled(true).catch(() => {});
        NativeAudioEngine.setReverbEnabled(true).catch(() => {});
      },
      onPanResponderMove: (_e, gestureState) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < DEBOUNCE_MS) return;
        lastUpdateRef.current = now;

        const halfPad = (PAD_SIZE - CURSOR_SIZE) / 2;
        const x = Math.max(-1, Math.min(1, gestureState.dx / halfPad));
        const y = Math.max(-1, Math.min(1, -gestureState.dy / halfPad));

        setPosition(x, y);
        applyAudioFromPosition(x, y);
      },
    }),
  ).current;

  const { x, y } = useSoundPadStore();
  const cursorLeft = ((x + 1) / 2) * (PAD_SIZE - CURSOR_SIZE);
  const cursorTop = ((1 - y) / 2) * (PAD_SIZE - CURSOR_SIZE);

  return (
    <View style={styles.overlay}>
      <View
        style={[
          styles.panel,
          { backgroundColor: moodTheme.glass, borderColor: moodTheme.glassBorder },
        ]}
        {...panResponder.panHandlers}
      >
        <Text style={[styles.label, styles.labelTop]}>Clear</Text>
        <Text style={[styles.label, styles.labelBottom]}>Calm</Text>
        <Text style={[styles.label, styles.labelLeft]}>Warm</Text>
        <Text style={[styles.label, styles.labelRight]}>Bright</Text>
        <View
          style={[
            styles.cursor,
            {
              left: cursorLeft,
              top: cursorTop,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6, 8, 18, 0.55)',
  },
  panel: {
    width: PAD_SIZE,
    height: PAD_SIZE,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursor: {
    position: 'absolute',
    width: CURSOR_SIZE,
    height: CURSOR_SIZE,
    borderRadius: CURSOR_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#fff',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    position: 'absolute',
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  labelTop: { top: 16 },
  labelBottom: { bottom: 16 },
  labelLeft: { left: 16 },
  labelRight: { right: 16 },
});
