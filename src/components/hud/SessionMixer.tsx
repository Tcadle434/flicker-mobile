import React from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { usePlayerStore } from '../../stores/playerStore';
import { theme } from '../../constants/theme';
import { audioCoordinator } from '../../services/audio/audioCoordinator';
import type { AudioLayer } from '../../types';

interface Props {
  onClose: () => void;
}

const LAYERS: { key: AudioLayer; label: string; color: string }[] = [
  { key: 'ambient', label: 'Ambient', color: '#8B5CF6' },
  { key: 'nature', label: 'Nature', color: '#10B981' },
  { key: 'melody', label: 'Melody', color: '#F59E0B' },
];

export default function SessionMixer({ onClose }: Props) {
  const layers = usePlayerStore((s) => s.layers);

  const getAdjacentLoopId = (layerKey: AudioLayer, direction: -1 | 1) => {
    const tracks = layers[layerKey].availableTracks;
    if (tracks.length < 2) {
      return null;
    }

    const currentIndex = tracks.findIndex((track) => track.id === layers[layerKey].currentLoopId);
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (startIndex + direction + tracks.length) % tracks.length;
    return tracks[nextIndex]?.id ?? null;
  };

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Mix</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>

        {/* Layer sliders */}
        {LAYERS.map(({ key, label, color }) => {
          const layerState = layers[key];
          const currentTrack =
            layerState.availableTracks.find((track) => track.id === layerState.currentLoopId) ??
            layerState.availableTracks[0] ??
            null;
          const canCycleTracks = layerState.availableTracks.length > 1;

          return (
            <View key={key} style={styles.sliderRow}>
              <View style={styles.labelRow}>
                <Text style={styles.layerLabel}>{label}</Text>
                <Text style={[styles.percentage, { color }]}>
                  {Math.round(layerState.volume * 100)}%
                </Text>
              </View>

              {canCycleTracks && currentTrack && (
                <View style={styles.trackRow}>
                  <TouchableOpacity
                    style={styles.trackButton}
                    activeOpacity={0.75}
                    onPress={() => {
                      const previousLoopId = getAdjacentLoopId(key, -1);
                      if (previousLoopId) {
                        void audioCoordinator.setFocusLayerLoop(key, previousLoopId);
                      }
                    }}
                  >
                    <Text style={styles.trackButtonText}>{'<'}</Text>
                  </TouchableOpacity>

                  <View style={styles.trackChip}>
                    <Text style={styles.trackChipText} numberOfLines={1}>
                      {currentTrack.label}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.trackButton}
                    activeOpacity={0.75}
                    onPress={() => {
                      const nextLoopId = getAdjacentLoopId(key, 1);
                      if (nextLoopId) {
                        void audioCoordinator.setFocusLayerLoop(key, nextLoopId);
                      }
                    }}
                  >
                    <Text style={styles.trackButtonText}>{'>'}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Slider
                value={layerState.volume}
                onValueChange={(v) => audioCoordinator.setFocusLayerVolume(key, v)}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                minimumTrackTintColor={color}
                maximumTrackTintColor="rgba(255, 255, 255, 0.15)"
                thumbTintColor={color}
                style={styles.slider}
              />
            </View>
          );
        })}
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 20,
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
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
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
  slider: {
    width: '100%',
    height: 32,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  trackButton: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackButtonText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  trackChip: {
    flex: 1,
    minHeight: 28,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    justifyContent: 'center',
  },
  trackChipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
  },
});
