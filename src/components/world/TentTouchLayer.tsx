/**
 * Tent Touch Layer
 *
 * Touch overlay for the tent interior.
 * - Tap to pick up items in edit mode
 * - Drag to move ghost item freely at pixel level
 */

import React, { useCallback, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDecorateStore } from '../../stores/decorateStore';
import { useTentStore } from '../../stores/tentStore';
import { getCatalogItem, getItemDimensions } from '../../services/tent/tentCatalog';

interface Props {
  scale: number;
  offsetY: number;
}

export default function TentTouchLayer({ scale, offsetY }: Props) {
  const isDecorating = useDecorateStore((s) => s.isDecorating);
  const ghostItemId = useDecorateStore((s) => s.ghostItemId);
  const updateGhostPosition = useDecorateStore((s) => s.updateGhostPosition);
  const startMoving = useDecorateStore((s) => s.startMoving);
  const placements = useTentStore((s) => s.placements);
  const currentRoomId = useTentStore((s) => s.currentRoomId);

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
      const roomPlacements = placements.filter((p) => p.roomId === currentRoomId);
      // Check in reverse (top-most items first)
      for (let i = roomPlacements.length - 1; i >= 0; i--) {
        const p = roomPlacements[i];
        const dims = getItemDimensions(p.itemId, p.direction);
        if (!dims) continue;
        if (px >= p.x && px < p.x + dims.w && py >= p.y && py < p.y + dims.h) {
          return p;
        }
      }
      return null;
    },
    [placements, currentRoomId],
  );

  const handleTouchStart = useCallback(
    (e: any) => {
      if (!isDecorating) return;
      const touch = e.nativeEvent;
      const { px, py } = toPixel(touch.locationX, touch.locationY);

      if (ghostItemId) {
        // Already have a ghost — start dragging from this point
        const ghostX = useDecorateStore.getState().ghostX;
        const ghostY = useDecorateStore.getState().ghostY;
        dragOffsetRef.current = { dx: px - ghostX, dy: py - ghostY };
        updateGhostPosition(px - dragOffsetRef.current.dx, py - dragOffsetRef.current.dy);
      } else {
        // Tap on a placed item to pick it up
        const placement = findPlacementAt(px, py);
        if (placement) {
          startMoving(placement.id);
          dragOffsetRef.current = { dx: px - placement.x, dy: py - placement.y };
        }
      }
    },
    [isDecorating, ghostItemId, toPixel, updateGhostPosition, findPlacementAt, startMoving],
  );

  const handleTouchMove = useCallback(
    (e: any) => {
      if (!isDecorating || !useDecorateStore.getState().ghostItemId) return;
      const touch = e.nativeEvent.touches?.[0] ?? e.nativeEvent;
      const { px, py } = toPixel(touch.locationX, touch.locationY);

      const offset = dragOffsetRef.current ?? { dx: 0, dy: 0 };
      updateGhostPosition(px - offset.dx, py - offset.dy);
    },
    [isDecorating, toPixel, updateGhostPosition],
  );

  if (!isDecorating) return null;

  return (
    <View
      style={styles.layer}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
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
