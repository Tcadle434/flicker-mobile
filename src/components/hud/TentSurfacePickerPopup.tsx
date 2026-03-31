import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import PixelPanel from './PixelPanel';
import { useTentStore } from '../../stores/tentStore';
import {
  getAllSurfaceStyles,
  getDefaultSurfaceStyleId,
  getSurfacePreview,
} from '../../services/tent/tentSurfaceCatalog';
import type { TentSurfaceStyle, TentSurfaceType } from '../../types/tent';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Props {
  visible: boolean;
  surfaceType: TentSurfaceType;
  onClose: () => void;
  onSelectStyle: (style: TentSurfaceStyle, surfaceType: TentSurfaceType) => void;
}

function getPreviewSize(surfaceType: TentSurfaceType): { width: number; height: number } {
  return surfaceType === 'floor'
    ? { width: 72, height: 48 }
    : { width: 16, height: 48 };
}

function SurfaceCard({
  style,
  isOwned,
  isEquipped,
  onSelect,
}: {
  style: TentSurfaceStyle;
  isOwned: boolean;
  isEquipped: boolean;
  onSelect: () => void;
}) {
  const preview = getSurfacePreview(style.id);
  const previewSize = getPreviewSize(style.surfaceType);

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.7}
      style={[styles.card, isEquipped && styles.cardSelected]}
    >
      <PixelPanel scale={1} style={styles.previewWrap}>
        {preview && (
          <Image
            source={preview}
            style={[previewSize, { alignSelf: 'center' }]}
            resizeMode="stretch"
          />
        )}
      </PixelPanel>

      <Text style={styles.cardTitle} numberOfLines={2}>{style.name}</Text>

      <Text style={styles.cardMeta}>
        {isOwned ? (isEquipped ? 'Equipped now' : 'Owned') : `${style.price} Light`}
      </Text>
    </TouchableOpacity>
  );
}

export default function TentSurfacePickerPopup({
  visible,
  surfaceType,
  onClose,
  onSelectStyle,
}: Props) {
  const currentRoomId = useTentStore((s) => s.currentRoomId);
  const roomStyleSelections = useTentStore((s) => s.roomStyleSelections);
  const isSurfaceStyleOwned = useTentStore((s) => s.isSurfaceStyleOwned);

  const stylesForSurface = useMemo(
    () => getAllSurfaceStyles(surfaceType),
    [surfaceType],
  );

  const equippedSelection = roomStyleSelections[currentRoomId];
  const equippedStyleId = surfaceType === 'floor'
    ? (equippedSelection?.floorStyleId ?? getDefaultSurfaceStyleId('floor'))
    : (equippedSelection?.wallStyleId ?? getDefaultSurfaceStyleId('wall'));

  return (
    <Modal visible={visible} transparent animationType="none">
      <Animated.View style={styles.overlay} entering={FadeIn.duration(200)}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View style={styles.center} entering={FadeInDown.duration(300)}>
          <View style={styles.labelWrap}>
            <Image
              source={require('../../../assets/ui/shop_label.png')}
              style={styles.labelBg}
              resizeMode="stretch"
            />
            <Text style={styles.labelText}>
              {surfaceType === 'floor' ? 'Floor' : 'Wallpaper'}
            </Text>
          </View>

          <PixelPanel style={styles.panel} inset={8}>
            <Text style={styles.helperText}>Tap a style to open purchase, preview, or cancel.</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.grid}
            >
              {stylesForSurface.map((style) => (
                <SurfaceCard
                  key={style.id}
                  style={style}
                  isOwned={isSurfaceStyleOwned(style.id)}
                  isEquipped={equippedStyleId === style.id}
                  onSelect={() => onSelectStyle(style, surfaceType)}
                />
              ))}
            </ScrollView>
          </PixelPanel>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
  },
  labelWrap: {
    width: SCREEN_W - 80,
    height: (SCREEN_W - 80) * (128 / 320),
    marginBottom: -20,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  labelText: {
    color: '#3B2A1A',
    fontFamily: 'Toriko',
    fontSize: 38,
    letterSpacing: 1,
    marginTop: -16,
    textShadowColor: 'rgba(255, 220, 160, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  panel: {
    width: SCREEN_W - 80,
    height: SCREEN_H * 0.48,
  },
  helperText: {
    color: '#5C4A3A',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  grid: {
    gap: 10,
    paddingBottom: 8,
  },
  card: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cardSelected: {
    backgroundColor: 'rgba(59, 42, 26, 0.08)',
  },
  previewWrap: {
    width: 82,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#3B2A1A',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardMeta: {
    color: '#8B7A6A',
    fontSize: 10,
    fontWeight: '600',
  },
});
