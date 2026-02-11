import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Slider } from './Slider';
import { usePlayerStore } from '../../stores/playerStore';
import { theme } from '../../constants/theme';
import type { AudioLayer } from '../../types';

interface SessionMixerProps {
  onClose: () => void;
}

const LAYERS: { key: AudioLayer; label: string; icon: string; color: string }[] = [
  { key: 'ambient', label: 'Ambient', icon: '\u223F', color: '#8B5CF6' },
  { key: 'nature', label: 'Nature', icon: '\u{1F33F}', color: '#10B981' },
  { key: 'melody', label: 'Melody', icon: '\u266A', color: '#F59E0B' },
];

export function SessionMixer({ onClose }: SessionMixerProps) {
  const layers = usePlayerStore((s) => s.layers);
  const setLayerVolume = usePlayerStore((s) => s.setLayerVolume);

  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback>
          <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Mix</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeText}>{'\u2715'}</Text>
                </TouchableOpacity>
              </View>

              {/* Layer sliders */}
              {LAYERS.map(({ key, label, icon, color }) => (
                <View key={key} style={styles.sliderRow}>
                  <View style={styles.labelRow}>
                    <View style={styles.labelLeft}>
                      <Text style={[styles.icon, { color }]}>{icon}</Text>
                      <Text style={styles.layerLabel}>{label}</Text>
                    </View>
                    <Text style={[styles.percentage, { color }]}>
                      {Math.round(layers[key].volume * 100)}%
                    </Text>
                  </View>
                  <Slider
                    value={layers[key].volume}
                    onValueChange={(v) => setLayerVolume(key, v)}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.01}
                  />
                </View>
              ))}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  sliderRow: {
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 18,
  },
  layerLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  percentage: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    minWidth: 36,
    textAlign: 'right',
  },
});
