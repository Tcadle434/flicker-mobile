/**
 * Tent Interior Screen
 *
 * Accessible from overworld via tent tap or decorate button.
 * Query param ?decorate=1 opens directly in decorate mode.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TentInteriorScene from '../../src/components/world/TentInteriorScene';
import TentTouchLayer from '../../src/components/world/TentTouchLayer';
import TentViewHud from '../../src/components/hud/TentViewHud';
import DecorateModeHud from '../../src/components/hud/DecorateModeHud';
import ItemTray from '../../src/components/hud/ItemTray';
import TentRoomEditPanel from '../../src/components/hud/TentRoomEditPanel';
import TentShopPopup from '../../src/components/hud/TentShopPopup';
import ItemConfirmPopup from '../../src/components/hud/ItemConfirmPopup';
import TentSurfacePickerPopup from '../../src/components/hud/TentSurfacePickerPopup';
import { TentSurfaceConfirmPopup } from '../../src/components/hud';
import { useDecorateStore } from '../../src/stores/decorateStore';
import { useTentStore } from '../../src/stores/tentStore';
import { getCatalogItem } from '../../src/services/tent/tentCatalog';
import { tentMap } from '../../src/services/world/tentMapLoader';
import type { CatalogItem, TentSurfaceStyle, TentSurfaceType } from '../../src/types/tent';

interface SurfaceSelectionState {
  style: TentSurfaceStyle;
  surfaceType: TentSurfaceType;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

function getSurfaceSaveErrorMessage(errorCode?: string): string {
  switch (errorCode) {
    case 'insufficient_funds':
      return 'You do not have enough Light to purchase this style.';
    case 'auth_required':
      return 'Please sign in again before changing your tent surfaces.';
    case 'invalid_surface_type':
      return 'That surface could not be applied.';
    default:
      return 'We could not save that floor or wallpaper change right now. Please try again.';
  }
}

export default function TentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ decorate?: string; shop?: string }>();
  const [ready, setReady] = useState(false);
  const [shopVisible, setShopVisible] = useState(false);
  const [confirmItem, setConfirmItem] = useState<CatalogItem | null>(null);
  const [previewingItemId, setPreviewingItemId] = useState<string | null>(null);
  const [activeSurfacePicker, setActiveSurfacePicker] = useState<TentSurfaceType | null>(null);
  const [surfaceConfirmSelection, setSurfaceConfirmSelection] = useState<SurfaceSelectionState | null>(null);
  const [previewingSurfaceSelection, setPreviewingSurfaceSelection] = useState<SurfaceSelectionState | null>(null);

  const isDecorating = useDecorateStore((s) => s.isDecorating);
  const subMode = useDecorateStore((s) => s.subMode);
  const ghostItemId = useDecorateStore((s) => s.ghostItemId);
  const enterDecorate = useDecorateStore((s) => s.enterDecorate);
  const exitDecorate = useDecorateStore((s) => s.exitDecorate);
  const startPlacing = useDecorateStore((s) => s.startPlacing);
  const startPreview = useDecorateStore((s) => s.startPreview);
  const cancelPlacement = useDecorateStore((s) => s.cancelPlacement);
  const clearSurfacePreview = useDecorateStore((s) => s.clearSurfacePreview);
  const previewSurfaceStyle = useDecorateStore((s) => s.previewSurfaceStyle);
  const switchToEditMode = useDecorateStore((s) => s.switchToEditMode);
  const purchaseItem = useTentStore((s) => s.purchaseItem);
  const commitSurfaceStyleSelection = useTentStore((s) => s.commitSurfaceStyleSelection);
  const isSurfaceStyleOwned = useTentStore((s) => s.isSurfaceStyleOwned);
  const isSavingSurfaceStyle = useTentStore((s) => s.isSavingSurfaceStyle);
  const getRoomStyleSelection = useTentStore((s) => s.getRoomStyleSelection);
  const currentRoomId = useTentStore((s) => s.currentRoomId);

  // Compute scale/offset to pass to touch layer
  const { scale, offsetY } = useMemo(() => {
    const s = SCREEN_W / (tentMap.width * tentMap.tileWidth);
    const mapPixelH = tentMap.height * tentMap.tileWidth * s;
    const oY = (SCREEN_H - mapPixelH) / 2;
    return { scale: s, offsetY: oY };
  }, []);

  // Auto-enter decorate mode if query param present
  useEffect(() => {
    if (params.decorate === '1' && ready) {
      enterDecorate();
    }
  }, [params.decorate, ready]);

  // Auto-open shop if query param present
  useEffect(() => {
    if (params.shop === '1' && ready) {
      setShopVisible(true);
    }
  }, [params.shop, ready]);

  // Clean up decorate state on unmount
  useEffect(() => {
    return () => exitDecorate();
  }, []);

  const handleReady = useCallback(() => setReady(true), []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleDecorate = useCallback(() => {
    enterDecorate();
  }, [enterDecorate]);

  const handleDoneDecorating = useCallback(() => {
    setActiveSurfacePicker(null);
    setSurfaceConfirmSelection(null);
    setPreviewingSurfaceSelection(null);
    clearSurfacePreview();
    exitDecorate();
  }, [clearSurfacePreview, exitDecorate]);

  const handleOpenShop = useCallback(() => {
    setShopVisible(true);
  }, []);

  const handleSelectShopItem = useCallback((item: CatalogItem) => {
    setShopVisible(false);
    setConfirmItem(item);
  }, []);

  const handlePurchase = useCallback(async (item: CatalogItem) => {
    const success = await purchaseItem(item.id, item.price);
    if (!success) return;
    setConfirmItem(null);
    enterDecorate();
    startPlacing(item.id);
  }, [purchaseItem, enterDecorate, startPlacing]);

  const handlePreview = useCallback((item: CatalogItem) => {
    setConfirmItem(null);
    setPreviewingItemId(item.id);
    enterDecorate();
    startPreview(item.id);
  }, [enterDecorate, startPreview]);

  const handleCancelConfirm = useCallback(() => {
    setConfirmItem(null);
    setShopVisible(true);
  }, []);

  const handleExitPreview = useCallback(() => {
    if (previewingSurfaceSelection) {
      clearSurfacePreview(previewingSurfaceSelection.surfaceType);
      exitDecorate();
      setSurfaceConfirmSelection(previewingSurfaceSelection);
      setPreviewingSurfaceSelection(null);
      return;
    }

    cancelPlacement();
    exitDecorate();
    const itemId = previewingItemId;
    setPreviewingItemId(null);
    if (itemId) {
      const item = getCatalogItem(itemId);
      if (item) setConfirmItem(item);
    }
  }, [
    cancelPlacement,
    clearSurfacePreview,
    exitDecorate,
    previewingItemId,
    previewingSurfaceSelection,
  ]);

  const handleOpenSurfacePicker = useCallback((surfaceType: TentSurfaceType) => {
    setSurfaceConfirmSelection(null);
    setActiveSurfacePicker(surfaceType);
  }, []);

  const handleCloseSurfacePicker = useCallback(() => {
    setActiveSurfacePicker(null);
  }, []);

  const handleSelectSurfaceStyle = useCallback((style: TentSurfaceStyle, surfaceType: TentSurfaceType) => {
    setActiveSurfacePicker(null);
    setSurfaceConfirmSelection({ style, surfaceType });
  }, []);

  const handleCancelSurfaceConfirm = useCallback(() => {
    const surfaceType = surfaceConfirmSelection?.surfaceType ?? previewingSurfaceSelection?.surfaceType ?? null;
    setSurfaceConfirmSelection(null);
    if (surfaceType) {
      setActiveSurfacePicker(surfaceType);
    }
  }, [previewingSurfaceSelection, surfaceConfirmSelection]);

  const handlePreviewSurface = useCallback((style: TentSurfaceStyle, surfaceType: TentSurfaceType) => {
    const selection = { style, surfaceType };
    setSurfaceConfirmSelection(null);
    setActiveSurfacePicker(null);
    setPreviewingSurfaceSelection(selection);
    enterDecorate();
    switchToEditMode();
    previewSurfaceStyle(currentRoomId, surfaceType, style.id);
  }, [currentRoomId, enterDecorate, previewSurfaceStyle, switchToEditMode]);

  const handlePurchaseOrEquipSurface = useCallback(async (style: TentSurfaceStyle, surfaceType: TentSurfaceType) => {
    const result = await commitSurfaceStyleSelection(currentRoomId, surfaceType, style.id);
    if (!result.ok) {
      Alert.alert('Could Not Save Surface', getSurfaceSaveErrorMessage(result.errorCode));
      return;
    }

    clearSurfacePreview(surfaceType);
    setPreviewingSurfaceSelection(null);
    setSurfaceConfirmSelection(null);
    enterDecorate();
    switchToEditMode();
  }, [
    clearSurfacePreview,
    commitSurfaceStyleSelection,
    currentRoomId,
    enterDecorate,
    switchToEditMode,
  ]);

  const surfaceConfirmOwned = surfaceConfirmSelection
    ? isSurfaceStyleOwned(surfaceConfirmSelection.style.id)
    : false;
  const currentRoomStyleSelection = getRoomStyleSelection(currentRoomId);
  const surfaceConfirmEquipped = surfaceConfirmSelection
    ? (
      surfaceConfirmSelection.surfaceType === 'floor'
        ? currentRoomStyleSelection.floorStyleId === surfaceConfirmSelection.style.id
        : currentRoomStyleSelection.wallStyleId === surfaceConfirmSelection.style.id
    )
    : false;
  const hasGhost = !!ghostItemId;

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <TentInteriorScene onReady={handleReady} />

      {ready && (
        <>
          <TentTouchLayer scale={scale} offsetY={offsetY} />

          {isDecorating ? (
            <>
              <DecorateModeHud
                onDone={handleDoneDecorating}
                onOpenShop={handleOpenShop}
                onExitPreview={handleExitPreview}
                surfacePreviewActive={!!previewingSurfaceSelection}
              />
              {!previewingSurfaceSelection && !hasGhost && subMode === 'place' ? (
                <ItemTray onOpenShop={handleOpenShop} />
              ) : !previewingSurfaceSelection && !hasGhost ? (
                <TentRoomEditPanel
                  onOpenFloor={() => handleOpenSurfacePicker('floor')}
                  onOpenWallpaper={() => handleOpenSurfacePicker('wall')}
                />
              ) : null}
            </>
          ) : (
            <TentViewHud onBack={handleBack} onDecorate={handleDecorate} onOpenShop={handleOpenShop} />
          )}
        </>
      )}
      <TentShopPopup visible={shopVisible} onClose={() => setShopVisible(false)} onSelectItem={handleSelectShopItem} />
      <ItemConfirmPopup item={confirmItem} onPurchase={handlePurchase} onPreview={handlePreview} onCancel={handleCancelConfirm} />
      {activeSurfacePicker && (
        <TentSurfacePickerPopup
          visible
          surfaceType={activeSurfacePicker}
          onClose={handleCloseSurfacePicker}
          onSelectStyle={handleSelectSurfaceStyle}
        />
      )}
      <TentSurfaceConfirmPopup
        styleItem={surfaceConfirmSelection?.style ?? null}
        surfaceType={surfaceConfirmSelection?.surfaceType ?? null}
        isOwned={surfaceConfirmOwned}
        isEquipped={surfaceConfirmEquipped}
        isSaving={isSavingSurfaceStyle}
        onPurchaseOrEquip={handlePurchaseOrEquipSurface}
        onPreview={handlePreviewSurface}
        onCancel={handleCancelSurfaceConfirm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
});
