import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useMoodTheme } from '../../hooks/useMoodTheme';
import { theme } from '../../constants/theme';

interface MoodCheckInProps {
  onSelect: (mood: string | null) => void;
}

const MOODS = [
  { key: 'calmer', label: 'Calmer' },
  { key: 'same', label: 'Same' },
  { key: 'worse', label: 'Worse' },
] as const;

export function MoodCheckIn({ onSelect }: MoodCheckInProps) {
  const moodTheme = useMoodTheme();
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (mood: string) => {
    setSelected(mood);
    onSelect(mood);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How do you feel?</Text>
      <View style={styles.row}>
        {MOODS.map(({ key, label }) => {
          const isActive = selected === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.chip,
                isActive && {
                  borderColor: moodTheme.primary,
                  backgroundColor: moodTheme.glass,
                },
              ]}
              onPress={() => handleSelect(key)}
            >
              <Text
                style={[
                  styles.chipText,
                  isActive && { color: theme.colors.text },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity style={styles.skipButton} onPress={() => onSelect(null)}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.md,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  skipButton: {
    marginTop: theme.spacing.md,
    padding: theme.spacing.sm,
  },
  skipText: {
    color: theme.colors.textTertiary,
    fontSize: theme.typography.fontSize.sm,
  },
});
