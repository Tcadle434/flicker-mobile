/**
 * Tent Touch Layer
 *
 * Touch overlay for the tent interior.
 * - Tap to pick up placed items while decorating
 * - Drag to move ghost item freely at pixel level
 */

import React, { useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDecorateStore } from '../../stores/decorateStore';
import { useTentStore } from '../../stores/tentStore';
import { getScaledItemDimensions } from '../../services/tent/tentCatalog';
import { compareTentPlacementsForRender } from '../../services/tent/tentRenderOrder';

interface Props {
  scale: number;
  offsetY: number;
}

export default function TentTouchLayer({ scale, offsetY }: Props) {
  const isDecorating = useDecorateStore((s) => s.isDecorating);
  const ghostItemId = useDecorateStore((s) => s.ghostItemId);
  const isPersistingPlacement = useDecorateStore((s) => s.isPersistingPlacement);
  const previewRoomId = useDecorateStore((s) => s.previewRoomId);
  const previewFloorStyleId = useDecorateStore((s) => s.previewFloorStyleId);
  const previewWallStyleId = useDecorateStore((s) => s.previewWallStyleId);
  const updateGhostPosition = useDecorateStore((s) => s.updateGhostPosition);
  const startMoving = useDecorateStore((s) => s.startMoving);
  const placements = useTentStore((s) => s.placements);
  const currentRoomId = useTentStore((s) => s.currentRoomId);
  const surfacePreviewActive = !!previewRoomId && (!!previewFloorStyleId || !!previewWallStyleId);
  const sortedRoomPlacements = React.useMemo(
    () => placements
      .filter((p) => p.roomId === currentRoomId)
      .sort(compareTentPlacementsForRender),
    [placements, currentRoomId],
  );

  // Drag offset: difference between touch point and ghost origin
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);

  /** Convert screen coords to tilemap pixel coords */
  const toPixel = useCallback(
    (screenX: number, screenY: number) => ({
      px: Math.round(screenX / scale),
      py: Math.round((screenY - offsetY) / scale),
    }),
    [scale, offsetY],
  );

  /** Find the placed item at a given tilemap pixel position */
  const findPlacementAt = useCallback(
    (px: number, py: number) => {
      // Check in reverse render order so top-most visible item wins.
      for (let i = sortedRoomPlacements.length - 1; i >= 0; i--) {
        const p = sortedRoomPlacements[i];
        const dims = getScaledItemDimensions(p.itemId, p.direction, p.scale);
        if (!dims) continue;
        if (px >= p.x && px < p.x + dims.w && py >= p.y && py < p.y + dims.h) {
          return p;
        }
      }
      return null;
    },
    [sortedRoomPlacements],
  );

  const handleTouchStart = useCallback(
    (e: any) => {
      if (!isDecorating || isPersistingPlacement) return;
      const touch = e.nativeEvent;
      const { px, py } = toPixel(touch.locationX, touch.locationY);

      if (ghostItemId) {
        // Already have a ghost — start dragging from this point
        const ghostX = useDecorateStore.getState().ghostX;
        const ghostY = useDecorateStore.getState().ghostY;
        dragOffsetRef.current = { dx: px - ghostX, dy: py - ghostY };
        updateGhostPosition(px - dragOffsetRef.current.dx, py - dragOffsetRef.current.dy);
      } else if (!surfacePreviewActive) {
        // Tap on a placed item to pick it up
        const placement = findPlacementAt(px, py);
        if (placement) {
          startMoving(placement.id);
          dragOffsetRef.current = { dx: px - placement.x, dy: py - placement.y };
        }
      }
    },
    [isDecorating, isPersistingPlacement, ghostItemId, surfacePreviewActive, toPixel, updateGhostPosition, findPlacementAt, startMoving],
  );

  const handleTouchMove = useCallback(
    (e: any) => {
      if (!isDecorating || isPersistingPlacement || !useDecorateStore.getState().ghostItemId) return;
      const touch = e.nativeEvent.touches?.[0] ?? e.nativeEvent;
      const { px, py } = toPixel(touch.locationX, touch.locationY);

      const offset = dragOffsetRef.current ?? { dx: 0, dy: 0 };
      updateGhostPosition(px - offset.dx, py - offset.dy);
    },
    [isDecorating, isPersistingPlacement, toPixel, updateGhostPosition],
  );

  if (!isDecorating) return null;

  return (
    <View
      style={styles.layer}
      onStartShouldSetResponder={(e) => {
        const state = useDecorateStore.getState();
        if (!state.isDecorating) return false;
        if (state.isPersistingPlacement) return false;
        if (state.ghostItemId) return true;

        const previewActive = !!state.previewRoomId
          && (!!state.previewFloorStyleId || !!state.previewWallStyleId);
        if (previewActive) return false;

        const { px, py } = toPixel(e.nativeEvent.locationX, e.nativeEvent.locationY);
        return !!findPlacementAt(px, py);
      }}
      onMoveShouldSetResponder={() => {
        const state = useDecorateStore.getState();
        return state.isDecorating && !state.isPersistingPlacement && !!state.ghostItemId;
      }}
      onResponderGrant={handleTouchStart}
      onResponderMove={handleTouchMove}
    />
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
});
