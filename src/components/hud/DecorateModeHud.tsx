/**
 * Decorate Mode HUD
 *
 * Shown when decorating the tent interior.
 * - Done button (top-right) → exit decorate mode
 * - When ghost active: Checkmark + X buttons (right side), Rotate (if rotatable)
 * - Checkmark disabled/red-tinted when ghostValid === false
 */

import React from 'react';
import { StyleSheet, TouchableOpacity, Image, View, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDecorateStore } from '../../stores/decorateStore';
import { getCatalogItem } from '../../services/tent/tentCatalog';
import HudIconButton from './HudIconButton';
import { HUD_ASSETS } from './hudAssets';

interface Props {
  onDone: () => void;
  onOpenShop: () => void;
  onExitPreview?: () => void;
  surfacePreviewActive?: boolean;
}

export default function DecorateModeHud({
  onDone,
  onOpenShop,
  onExitPreview,
  surfacePreviewActive = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const ghostItemId = useDecorateStore((s) => s.ghostItemId);
  const ghostPlacementId = useDecorateStore((s) => s.ghostPlacementId);
  const ghostValid = useDecorateStore((s) => s.ghostValid);
  const isPreview = useDecorateStore((s) => s.isPreview);
  const confirmPlacement = useDecorateStore((s) => s.confirmPlacement);
  const cancelPlacement = useDecorateStore((s) => s.cancelPlacement);
  const rotateGhost = useDecorateStore((s) => s.rotateGhost);
  const removeGhostItem = useDecorateStore((s) => s.removeGhostItem);

  const item = ghostItemId ? getCatalogItem(ghostItemId) : null;
  const canRotate = item?.rotatable ?? false;
  const hasGhost = !!ghostItemId;
  const isMoving = !!ghostPlacementId;
  const showSurfacePreviewBack = surfacePreviewActive && !hasGhost;

  return (
    <Animated.View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      pointerEvents="box-none"
      entering={FadeIn.duration(200)}
    >
      {/* Done button — top right */}
      <TouchableOpacity
        onPress={onDone}
        activeOpacity={0.7}
        style={[styles.doneBtn, { top: insets.top + 8 }]}
      >
        <View style={styles.doneBg}>
          <Image
            source={HUD_ASSETS.xClose}
            style={styles.doneIcon}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {/* Shop button — top left */}
      <View style={[styles.shopBtn, { top: insets.top + 8 }]}>
        <HudIconButton icon="shop" onPress={onOpenShop} />
      </View>

      {/* Placement controls — bottom right, horizontal row */}
      {hasGhost && (
        <Animated.View
          style={[styles.placementControls, { bottom: insets.bottom + 16 }]}
          entering={FadeIn.duration(200)}
        >
          {isPreview ? (
            <>
              {/* Preview mode: Back + Rotate only */}
              {canRotate && (
                <TouchableOpacity
                  onPress={rotateGhost}
                  activeOpacity={0.7}
                  style={styles.controlBtn}
                >
                  <Image
                    source={HUD_ASSETS.rotate}
                    style={styles.controlIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onExitPreview}
                activeOpacity={0.7}
                style={styles.backBtn}
              >
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Normal mode: Remove + Rotate + Cancel + Confirm */}
              {isMoving && (
                <TouchableOpacity
                  onPress={removeGhostItem}
                  activeOpacity={0.7}
                  style={styles.removeBtn}
                >
                  <Text style={styles.removeText}>Remove</Text>
                </TouchableOpacity>
              )}

              {canRotate && (
                <TouchableOpacity
                  onPress={rotateGhost}
                  activeOpacity={0.7}
                  style={styles.controlBtn}
                >
                  <Image
                    source={HUD_ASSETS.rotate}
                    style={styles.controlIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={cancelPlacement}
                activeOpacity={0.7}
                style={styles.controlBtn}
              >
                <Image
                  source={HUD_ASSETS.xClose}
                  style={styles.controlIconLg}
                  resizeMode="contain"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={ghostValid ? confirmPlacement : undefined}
                activeOpacity={ghostValid ? 0.7 : 1}
                style={[styles.controlBtn, !ghostValid && styles.controlBtnDisabled]}
              >
                <Image
                  source={HUD_ASSETS.checkmark}
                  style={[styles.controlIconLg, !ghostValid && styles.iconDisabled]}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      )}

      {showSurfacePreviewBack && (
        <Animated.View
          style={[styles.surfacePreviewControls, { bottom: insets.bottom + 16 }]}
          entering={FadeIn.duration(200)}
        >
          <TouchableOpacity
            onPress={onExitPreview}
            activeOpacity={0.7}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  doneBtn: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBg: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
  },
  doneIcon: {
    width: 24,
    height: 24,
  },
  shopBtn: {
    position: 'absolute',
    left: 16,
  },
  placementControls: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  surfacePreviewControls: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnDisabled: {
    opacity: 0.4,
  },
  controlIcon: {
    width: 32,
    height: 32,
  },
  controlIconLg: {
    width: 40,
    height: 40,
  },
  iconDisabled: {
    tintColor: 'rgba(200, 80, 80, 0.7)',
  },
  removeBtn: {
    backgroundColor: 'rgba(200, 60, 60, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
  },
  removeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  backBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  backText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
