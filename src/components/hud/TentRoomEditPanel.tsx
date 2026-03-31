import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PixelPanel from './PixelPanel';
import TentDecorateModeToggle from './TentDecorateModeToggle';
import { useDecorateStore } from '../../stores/decorateStore';
import { useTentStore } from '../../stores/tentStore';
import {
  createDefaultRoomStyleSelection,
  getSurfacePreview,
  getSurfaceStyle,
} from '../../services/tent/tentSurfaceCatalog';
import type { TentSurfaceType } from '../../types/tent';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_HEIGHT = 196;

function getPreviewSize(surfaceType: TentSurfaceType): { width: number; height: number } {
  return surfaceType === 'floor'
    ? { width: 110, height: 68 }
    : { width: 24, height: 68 };
}

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
  const floorStyle = getSurfaceStyle(roomStyleSelection.floorStyleId);
  const wallStyle = getSurfaceStyle(roomStyleSelection.wallStyleId);
  const floorPreview = floorStyle ? getSurfacePreview(floorStyle.id) : null;
  const wallPreview = wallStyle ? getSurfacePreview(wallStyle.id) : null;
  const floorStyleName = floorStyle?.name ?? 'Default';
  const wallStyleName = wallStyle?.name ?? 'Default';

  return (
    <Animated.View
      style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}
      entering={SlideInDown.duration(300)}
    >
      <PixelPanel scale={1} style={styles.panel} inset={8}>
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
            <PixelPanel scale={1} style={styles.previewFrame} inset={6}>
              <View style={styles.previewContent}>
                {floorPreview ? (
                  <Image
                    source={floorPreview}
                    style={[styles.previewImage, getPreviewSize('floor')]}
                    resizeMode="stretch"
                  />
                ) : null}
              </View>
            </PixelPanel>

            <View style={styles.cardText}>
              <Text style={styles.actionLabel}>Floor</Text>
              <Text style={styles.actionValue} numberOfLines={2}>{floorStyleName}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={onOpenWallpaper} activeOpacity={0.7} style={styles.actionCard}>
            <PixelPanel scale={1} style={styles.previewFrame} inset={6}>
              <View style={styles.previewContent}>
                {wallPreview ? (
                  <View style={styles.wallPreviewRow}>
                    {[0, 1, 2].map((index) => (
                      <Image
                        key={index}
                        source={wallPreview}
                        style={[styles.previewImage, getPreviewSize('wall')]}
                        resizeMode="stretch"
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            </PixelPanel>

            <View style={styles.cardText}>
              <Text style={styles.actionLabel}>Wallpaper</Text>
              <Text style={styles.actionValue} numberOfLines={2}>{wallStyleName}</Text>
            </View>
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
    height: PANEL_HEIGHT,
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
    flex: 1,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(59, 42, 26, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 10,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  previewFrame: {
    width: '100%',
    height: 78,
  },
  previewContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wallPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  previewImage: {
    alignSelf: 'center',
  },
  cardText: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
});
