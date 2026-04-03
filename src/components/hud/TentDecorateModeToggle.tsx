import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  activeMode: 'place' | 'edit';
  onSelectItems: () => void;
  onSelectRoom: () => void;
}

export default function TentDecorateModeToggle({
  activeMode,
  onSelectItems,
  onSelectRoom,
}: Props) {
  return (
    <View style={styles.toggle}>
      <TouchableOpacity
        onPress={onSelectItems}
        activeOpacity={activeMode === 'place' ? 1 : 0.7}
        style={[styles.option, activeMode === 'place' && styles.optionActive]}
      >
        <Text style={[styles.optionText, activeMode === 'place' && styles.optionTextActive]}>
          Items
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSelectRoom}
        activeOpacity={activeMode === 'edit' ? 1 : 0.7}
        style={[styles.option, activeMode === 'edit' && styles.optionActive]}
      >
        <Text style={[styles.optionText, activeMode === 'edit' && styles.optionTextActive]}>
          Room
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(59, 42, 26, 0.08)',
    borderRadius: 10,
    padding: 3,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  optionActive: {
    backgroundColor: 'rgba(59, 42, 26, 0.16)',
  },
  optionText: {
    color: '#8B7A6A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  optionTextActive: {
    color: '#3B2A1A',
  },
});
