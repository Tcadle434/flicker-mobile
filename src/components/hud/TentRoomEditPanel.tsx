import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PixelPanel from './PixelPanel';
import TentDecorateModeToggle from './TentDecorateModeToggle';
import { useDecorateStore } from '../../stores/decorateStore';
import { useTentStore } from '../../stores/tentStore';
import {
  createDefaultRoomStyleSelection,
  getSurfaceStyle,
} from '../../services/tent/tentSurfaceCatalog';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  onOpenFloor: () => void;
  onOpenWallpaper: () => void;
}

export default function TentRoomEditPanel({ onOpenFloor, onOpenWallpaper }: Props) {
  const insets = useSafeAreaInsets();
  const currentRoomId = useTentStore((s) => s.currentRoomId);
  const roomStyleSelections = useTentStore((s) => s.roomStyleSelections);
  const switchToPlaceMode = useDecorateStore((s) => s.switchToPlaceMode);

  const roomStyleSelection = roomStyleSelections[currentRoomId]
    ?? createDefaultRoomStyleSelection(currentRoomId);
  const floorStyleName = getSurfaceStyle(roomStyleSelection.floorStyleId)?.name ?? 'Default';
  const wallStyleName = getSurfaceStyle(roomStyleSelection.wallStyleId)?.name ?? 'Default';

  return (
    <Animated.View
      style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}
      entering={SlideInDown.duration(300)}
    >
      <PixelPanel variant={2} style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Room Finish</Text>
          <TentDecorateModeToggle
            activeMode="edit"
            onSelectItems={switchToPlaceMode}
            onSelectRoom={() => undefined}
          />
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={onOpenFloor} activeOpacity={0.7} style={styles.actionCard}>
            <Text style={styles.actionLabel}>Floor</Text>
            <Text style={styles.actionValue} numberOfLines={1}>{floorStyleName}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenWallpaper} activeOpacity={0.7} style={styles.actionCard}>
            <Text style={styles.actionLabel}>Wallpaper</Text>
            <Text style={styles.actionValue} numberOfLines={1}>{wallStyleName}</Text>
          </TouchableOpacity>
        </View>
      </PixelPanel>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
  },
  panel: {
    width: SCREEN_W - 24,
    height: 116,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerText: {
    color: '#3B2A1A',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(59, 42, 26, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  actionLabel: {
    color: '#8B7A6A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  actionValue: {
    color: '#3B2A1A',
    fontSize: 13,
    fontWeight: '700',
  },
});
