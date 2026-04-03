import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { theme } from '../../constants/theme';
import { usePlayerStore } from '../../stores/playerStore';
import {
  getResetSessionAudioProfile,
  getResetSessionSelectedTracks,
} from '../../services/audio/resetSessionAudioProfiles';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  trackLabel?: string;
  volume?: number;
  sliderColor?: string;
  onVolumeChange?: (volume: number) => void;
}

const MODE_COLORS = {
  '432hz': '#2DD4BF',
  binauralBeats: '#60A5FA',
} as const;

export default function StandaloneSessionAudioPanel({
  visible,
  onClose,
  title,
  subtitle,
  trackLabel,
  volume,
  sliderColor,
  onVolumeChange,
}: Props) {
  const resetSessionAudioMode = usePlayerStore((s) => s.resetSessionAudioMode);
  const resetSessionSelections = usePlayerStore((s) => s.resetSessionSelections);
  const resetSessionVolumes = usePlayerStore((s) => s.resetSessionVolumes);
  const setResetSessionStandaloneVolume = usePlayerStore((s) => s.setResetSessionStandaloneVolume);

  const isControlled = typeof onVolumeChange === 'function';
  const resolvedSliderColor = sliderColor ?? MODE_COLORS['432hz'];

  if (isControlled) {
    if (!visible) {
      return null;
    }

    return (
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title ?? 'Audio'}</Text>
              <Text style={styles.subtitle}>{subtitle ?? 'Looping standalone audio'}</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.trackCard}>
            <Text style={styles.trackLabel}>Current Track</Text>
            <Text style={styles.trackValue}>{trackLabel ?? 'Unavailable'}</Text>
          </View>

          <View style={styles.volumeBlock}>
            <View style={styles.volumeHeader}>
              <Text style={styles.volumeLabel}>Volume</Text>
              <Text style={[styles.volumeValue, { color: resolvedSliderColor }]}>
                {Math.round((volume ?? 0.5) * 100)}%
              </Text>
            </View>

            <Slider
              value={volume ?? 0.5}
              onValueChange={onVolumeChange}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              minimumTrackTintColor={resolvedSliderColor}
              maximumTrackTintColor="rgba(255, 255, 255, 0.15)"
              thumbTintColor={resolvedSliderColor}
              style={styles.slider}
            />
          </View>
        </Pressable>
      </Pressable>
    );
  }

  const profile = getResetSessionAudioProfile(resetSessionAudioMode);
  const standaloneLayer = profile.standaloneLayer;

  if (!visible || !standaloneLayer || !profile.showStandaloneVolumeControl) {
    return null;
  }

  const currentTrack = getResetSessionSelectedTracks(
    resetSessionAudioMode,
    resetSessionSelections[resetSessionAudioMode],
  )[standaloneLayer];
  const resolvedResetSliderColor =
    resetSessionAudioMode === '432hz' ? MODE_COLORS['432hz'] : MODE_COLORS.binauralBeats;
  const resolvedResetVolume =
    resetSessionVolumes[resetSessionAudioMode][standaloneLayer] ??
    profile.defaultVolumes[standaloneLayer] ??
    0.5;

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.card} onPress={(event) => event.stopPropagation()}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{profile.label}</Text>
            <Text style={styles.subtitle}>Looping standalone audio</Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>{'\u2715'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.trackCard}>
          <Text style={styles.trackLabel}>Current Track</Text>
          <Text style={styles.trackValue}>{currentTrack?.label ?? 'Unavailable'}</Text>
        </View>

        <View style={styles.volumeBlock}>
          <View style={styles.volumeHeader}>
            <Text style={styles.volumeLabel}>Volume</Text>
            <Text style={[styles.volumeValue, { color: resolvedResetSliderColor }]}>
              {Math.round(resolvedResetVolume * 100)}%
            </Text>
          </View>

          <Slider
            value={resolvedResetVolume}
            onValueChange={setResetSessionStandaloneVolume}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            minimumTrackTintColor={resolvedResetSliderColor}
            maximumTrackTintColor="rgba(255, 255, 255, 0.15)"
            thumbTintColor={resolvedResetSliderColor}
            style={styles.slider}
          />
        </View>
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
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 1,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.xs,
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
  trackCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  trackLabel: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.fontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  trackValue: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  volumeBlock: {
    gap: 4,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  volumeLabel: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  volumeValue: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  slider: {
    width: '100%',
    height: 32,
  },
});
