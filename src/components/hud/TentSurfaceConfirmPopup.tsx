import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Modal,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useCurrencyStore } from '../../stores/currencyStore';
import { getSurfacePreview } from '../../services/tent/tentSurfaceCatalog';
import PixelPanel from './PixelPanel';
import type { TentSurfaceStyle, TentSurfaceType } from '../../types/tent';

function getPreviewSize(surfaceType: TentSurfaceType): { width: number; height: number } {
  return surfaceType === 'floor'
    ? { width: 72, height: 48 }
    : { width: 16, height: 48 };
}

function SurfacePreview({
  styleItem,
  surfaceType,
}: {
  styleItem: TentSurfaceStyle;
  surfaceType: TentSurfaceType;
}) {
  const preview = getSurfacePreview(styleItem.id);
  const previewSize = getPreviewSize(surfaceType);

  if (!preview) {
    return null;
  }

  if (surfaceType === 'wall') {
    return (
      <View style={styles.wallPreviewRow}>
        {[0, 1, 2].map((index) => (
          <Image
            key={index}
            source={preview}
            style={[previewSize, styles.previewImage]}
            resizeMode="stretch"
          />
        ))}
      </View>
    );
  }

  return (
    <Image
      source={preview}
      style={[previewSize, styles.previewImage]}
      resizeMode="stretch"
    />
  );
}

interface Props {
  styleItem: TentSurfaceStyle | null;
  surfaceType: TentSurfaceType | null;
  isOwned: boolean;
  isEquipped: boolean;
  isSaving: boolean;
  onPurchaseOrEquip: (style: TentSurfaceStyle, surfaceType: TentSurfaceType) => void;
  onPreview: (style: TentSurfaceStyle, surfaceType: TentSurfaceType) => void;
  onCancel: () => void;
}

export default function TentSurfaceConfirmPopup({
  styleItem,
  surfaceType,
  isOwned,
  isEquipped,
  isSaving,
  onPurchaseOrEquip,
  onPreview,
  onCancel,
}: Props) {
  const balance = useCurrencyStore((s) => s.balance);

  if (!styleItem || !surfaceType) return null;

  const canAfford = isOwned || balance >= styleItem.price;
  let primaryLabel = 'Purchase';
  if (isSaving) primaryLabel = 'Saving...';
  else if (isEquipped) primaryLabel = 'Equipped';
  else if (isOwned) primaryLabel = 'Equip';

  const primaryDisabled = !canAfford || isEquipped || isSaving;
  const secondaryDisabled = isSaving;

  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={styles.overlay} entering={FadeIn.duration(200)}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          disabled={secondaryDisabled}
          onPress={secondaryDisabled ? undefined : onCancel}
        />

        <Animated.View style={styles.center} entering={FadeInDown.duration(300)}>
          <PixelPanel style={styles.panel} inset={8}>
            <View style={styles.content}>
              <PixelPanel scale={1} style={styles.thumbWrap}>
                <SurfacePreview styleItem={styleItem} surfaceType={surfaceType} />
              </PixelPanel>

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
                  disabled={primaryDisabled}
                  onPress={primaryDisabled ? undefined : () => onPurchaseOrEquip(styleItem, surfaceType)}
                  activeOpacity={primaryDisabled ? 1 : 0.7}
                  style={[styles.actionBtn, styles.purchaseBtn, primaryDisabled && styles.actionBtnDisabled]}
                >
                  <Text style={[styles.actionText, styles.purchaseText, primaryDisabled && styles.actionTextDisabled]}>
                    {primaryLabel}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={secondaryDisabled}
                  onPress={secondaryDisabled ? undefined : () => onPreview(styleItem, surfaceType)}
                  activeOpacity={secondaryDisabled ? 1 : 0.7}
                  style={[styles.actionBtn, styles.previewBtn, secondaryDisabled && styles.actionBtnDisabled]}
                >
                  <Text style={[styles.actionText, styles.previewText, secondaryDisabled && styles.actionTextDisabled]}>Preview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={secondaryDisabled}
                  onPress={secondaryDisabled ? undefined : onCancel}
                  activeOpacity={secondaryDisabled ? 1 : 0.7}
                  style={[styles.actionBtn, styles.cancelBtn, secondaryDisabled && styles.actionBtnDisabled]}
                >
                  <Text style={[styles.actionText, styles.cancelText, secondaryDisabled && styles.actionTextDisabled]}>Cancel</Text>
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
  wallPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    alignSelf: 'center',
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
