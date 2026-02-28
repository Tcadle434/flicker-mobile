/**
 * Tent Interior Screen
 *
 * Accessible from overworld via tent tap or decorate button.
 * Query param ?decorate=1 opens directly in decorate mode.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import TentInteriorScene from '../../src/components/world/TentInteriorScene';
import TentTouchLayer from '../../src/components/world/TentTouchLayer';
import TentViewHud from '../../src/components/hud/TentViewHud';
import DecorateModeHud from '../../src/components/hud/DecorateModeHud';
import ItemTray from '../../src/components/hud/ItemTray';
import TentShopPopup from '../../src/components/hud/TentShopPopup';
import ItemConfirmPopup from '../../src/components/hud/ItemConfirmPopup';
import { useDecorateStore } from '../../src/stores/decorateStore';
import { useTentStore } from '../../src/stores/tentStore';
import { getCatalogItem } from '../../src/services/tent/tentCatalog';
import { tentMap } from '../../src/services/world/tentMapLoader';
import type { CatalogItem } from '../../src/types/tent';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function TentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ decorate?: string; shop?: string }>();
  const [ready, setReady] = useState(false);
  const [shopVisible, setShopVisible] = useState(false);
  const [confirmItem, setConfirmItem] = useState<CatalogItem | null>(null);
  const [previewingItemId, setPreviewingItemId] = useState<string | null>(null);

  const isDecorating = useDecorateStore((s) => s.isDecorating);
  const subMode = useDecorateStore((s) => s.subMode);
  const enterDecorate = useDecorateStore((s) => s.enterDecorate);
  const exitDecorate = useDecorateStore((s) => s.exitDecorate);
  const startPlacing = useDecorateStore((s) => s.startPlacing);
  const startPreview = useDecorateStore((s) => s.startPreview);
  const cancelPlacement = useDecorateStore((s) => s.cancelPlacement);
  const purchaseItem = useTentStore((s) => s.purchaseItem);

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
    exitDecorate();
  }, [exitDecorate]);

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
    cancelPlacement();
    exitDecorate();
    const itemId = previewingItemId;
    setPreviewingItemId(null);
    if (itemId) {
      const item = getCatalogItem(itemId);
      if (item) setConfirmItem(item);
    }
  }, [cancelPlacement, exitDecorate, previewingItemId]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      <TentInteriorScene onReady={handleReady} />

      {ready && (
        <>
          <TentTouchLayer scale={scale} offsetY={offsetY} />

          {isDecorating ? (
            <>
              <DecorateModeHud onDone={handleDoneDecorating} onOpenShop={handleOpenShop} onExitPreview={handleExitPreview} />
              <ItemTray onOpenShop={handleOpenShop} />
            </>
          ) : (
            <TentViewHud onBack={handleBack} onDecorate={handleDecorate} onOpenShop={handleOpenShop} />
          )}
        </>
      )}
      <TentShopPopup visible={shopVisible} onClose={() => setShopVisible(false)} onSelectItem={handleSelectShopItem} />
      <ItemConfirmPopup item={confirmItem} onPurchase={handlePurchase} onPreview={handlePreview} onCancel={handleCancelConfirm} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
});
