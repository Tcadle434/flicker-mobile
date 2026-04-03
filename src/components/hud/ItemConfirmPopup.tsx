/**
 * Item Confirmation Popup
 *
 * Shown after tapping a shop item. Displays item thumbnail, name, price,
 * and three actions: Purchase, Preview, Cancel.
 */

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
import { getItemThumbnail, getItemDimensions } from '../../services/tent/tentCatalog';
import PixelPanel from './PixelPanel';
import type { CatalogItem } from '../../types/tent';

const THUMB_SIZE = 64;

function getThumbSize(itemId: string): { width: number; height: number } {
  const dims = getItemDimensions(itemId, 'down');
  if (!dims) return { width: THUMB_SIZE, height: THUMB_SIZE };
  // Scale up to fit the larger preview area
  const scale = Math.min(THUMB_SIZE / dims.w, THUMB_SIZE / dims.h, 2);
  return { width: dims.w * scale, height: dims.h * scale };
}

interface Props {
  item: CatalogItem | null;
  onPurchase: (item: CatalogItem) => void;
  onPreview: (item: CatalogItem) => void;
  onCancel: () => void;
}

export default function ItemConfirmPopup({ item, onPurchase, onPreview, onCancel }: Props) {
  const balance = useCurrencyStore((s) => s.balance);

  if (!item) return null;

  const canAfford = balance >= item.price;
  const thumbnail = getItemThumbnail(item.id);
  const thumbSize = getThumbSize(item.id);

  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={styles.overlay} entering={FadeIn.duration(200)}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCancel}
        />

        <Animated.View style={styles.center} entering={FadeInDown.duration(300)}>
          <PixelPanel style={styles.panel} inset={8}>
            <View style={styles.content}>
              {/* Thumbnail */}
              <PixelPanel scale={1} style={styles.thumbWrap}>
                {thumbnail && (
                  <Image
                    source={thumbnail}
                    style={{ width: thumbSize.width, height: thumbSize.height, alignSelf: 'center' }}
                    resizeMode="contain"
                  />
                )}
              </PixelPanel>

              {/* Name */}
              <Text style={styles.itemName}>{item.name}</Text>

              {/* Price */}
              <View style={styles.priceRow}>
                <Image
                  source={require('../../../assets/ui/light-icon.png')}
                  style={styles.lightIcon}
                  resizeMode="contain"
                />
                <Text style={styles.priceText}>{item.price} Light</Text>
              </View>

              {/* Action buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  onPress={canAfford ? () => onPurchase(item) : undefined}
                  activeOpacity={canAfford ? 0.7 : 1}
                  style={[styles.actionBtn, styles.purchaseBtn, !canAfford && styles.actionBtnDisabled]}
                >
                  <Text style={[styles.actionText, styles.purchaseText, !canAfford && styles.actionTextDisabled]}>
                    Purchase
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onPreview(item)}
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
