import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  Image,
  StyleSheet,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useCurrencyStore } from '../../stores/currencyStore';
import { getSurfacePreview } from '../../services/tent/tentSurfaceCatalog';
import PixelPanel from './PixelPanel';
import { HUD_ASSETS } from './hudAssets';
import type { TentSurfaceStyle, TentSurfaceType } from '../../types/tent';

function getPreviewSize(surfaceType: TentSurfaceType): { width: number; height: number } {
  return surfaceType === 'floor'
    ? { width: 72, height: 48 }
    : { width: 16, height: 48 };
}

interface Props {
  styleItem: TentSurfaceStyle | null;
  surfaceType: TentSurfaceType | null;
  isOwned: boolean;
  isEquipped: boolean;
  onPurchaseOrEquip: (style: TentSurfaceStyle, surfaceType: TentSurfaceType) => void;
  onPreview: (style: TentSurfaceStyle, surfaceType: TentSurfaceType) => void;
  onCancel: () => void;
}

export default function TentSurfaceConfirmPopup({
  styleItem,
  surfaceType,
  isOwned,
  isEquipped,
  onPurchaseOrEquip,
  onPreview,
  onCancel,
}: Props) {
  const balance = useCurrencyStore((s) => s.balance);

  if (!styleItem || !surfaceType) return null;

  const canAfford = isOwned || balance >= styleItem.price;
  const preview = getSurfacePreview(styleItem.id);
  const previewSize = getPreviewSize(surfaceType);

  let primaryLabel = `Purchase`;
  if (isEquipped) primaryLabel = 'Equipped';
  else if (isOwned) primaryLabel = 'Equip';

  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={styles.overlay} entering={FadeIn.duration(200)}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCancel}
        />

        <Animated.View style={styles.center} entering={FadeInDown.duration(300)}>
          <PixelPanel variant={1} style={styles.panel}>
            <View style={styles.content}>
              <ImageBackground
                source={HUD_ASSETS.itemShopBg}
                style={styles.thumbWrap}
                resizeMode="stretch"
              >
                {preview && (
                  <Image
                    source={preview}
                    style={previewSize}
                    resizeMode="stretch"
                  />
                )}
              </ImageBackground>

              <Text style={styles.itemName}>{styleItem.name}</Text>

              <View style={styles.priceRow}>
                <Image
                  source={require('../../../assets/ui/light-icon.png')}
                  style={styles.lightIcon}
                  resizeMode="contain"
                />
                <Text style={styles.priceText}>
                  {isOwned ? 'Owned' : `${styleItem.price} Light`}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={canAfford && !isEquipped ? () => onPurchaseOrEquip(styleItem, surfaceType) : undefined}
                  activeOpacity={canAfford && !isEquipped ? 0.7 : 1}
                  style={[styles.actionBtn, styles.purchaseBtn, (!canAfford || isEquipped) && styles.actionBtnDisabled]}
                >
                  <Text style={[styles.actionText, styles.purchaseText, (!canAfford || isEquipped) && styles.actionTextDisabled]}>
                    {primaryLabel}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onPreview(styleItem, surfaceType)}
                  activeOpacity={0.7}
                  style={[styles.actionBtn, styles.previewBtn]}
                >
                  <Text style={[styles.actionText, styles.previewText]}>Preview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onCancel}
                  activeOpacity={0.7}
                  style={[styles.actionBtn, styles.cancelBtn]}
                >
                  <Text style={[styles.actionText, styles.cancelText]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  panel: {
    width: 240,
    height: 230,
  },
  content: {
    alignItems: 'center',
  },
  thumbWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  itemName: {
    color: '#3B2A1A',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
  },
  lightIcon: {
    width: 14,
    height: 14,
  },
  priceText: {
    color: '#5C4A3A',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  purchaseBtn: {
    backgroundColor: 'rgba(59, 42, 26, 0.2)',
  },
  previewBtn: {
    backgroundColor: 'rgba(59, 42, 26, 0.1)',
  },
  cancelBtn: {
    backgroundColor: 'rgba(59, 42, 26, 0.06)',
  },
  actionBtnDisabled: {
    opacity: 0.35,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  purchaseText: {
    color: '#3B2A1A',
  },
  previewText: {
    color: '#5C4A3A',
  },
  cancelText: {
    color: '#8B7A6A',
  },
  actionTextDisabled: {
    color: '#8B7A6A',
  },
});
