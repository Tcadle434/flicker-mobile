/**
 * DemoFurniturePlacement
 *
 * Animated furniture items dropping onto the tent scene during the cinematic demo.
 * Uses RN Animated.Image positioned absolutely on top of TentInteriorScene.
 * Each item drops from above with a spring bounce, staggered by 1s.
 */

import React from 'react';
import { StyleSheet, Dimensions, Image as RNImage } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated';
import { tentMap } from '../../../services/world/tentMapLoader';
import { ONBOARDING_ASSETS } from '../onboardingAssets';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Scale to fit tent map width to screen
const TENT_SCALE = SCREEN_W / (tentMap.width * tentMap.tileWidth);
const TENT_MAP_PIXEL_H = tentMap.height * tentMap.tileWidth * TENT_SCALE;
const TENT_OFFSET_Y = (SCREEN_H - TENT_MAP_PIXEL_H) / 2;

// Item definitions: tile positions chosen to look good in the tent interior
const ITEMS = [
  {
    id: 'potted_plant',
    source: ONBOARDING_ASSETS.pottedPlant,
    tileX: 11,
    tileY: 24,
  },
  {
    id: 'floor_lamp',
    source: ONBOARDING_ASSETS.floorLamp,
    tileX: 22,
    tileY: 20,
  },
  {
    id: 'bookshelf',
    source: ONBOARDING_ASSETS.bookshelf,
    tileX: 16,
    tileY: 14,
  },
] as const;

// Resolve sprite dimensions at init time
function getItemLayout(source: number) {
  const asset = RNImage.resolveAssetSource(source);
  const w = asset.width * TENT_SCALE;
  const h = asset.height * TENT_SCALE;
  return { w, h };
}

interface Props {
  /** One shared value per item: translateY from drop animation */
  item0TranslateY: SharedValue<number>;
  item0Opacity: SharedValue<number>;
  item1TranslateY: SharedValue<number>;
  item1Opacity: SharedValue<number>;
  item2TranslateY: SharedValue<number>;
  item2Opacity: SharedValue<number>;
}

export default function DemoFurniturePlacement({
  item0TranslateY,
  item0Opacity,
  item1TranslateY,
  item1Opacity,
  item2TranslateY,
  item2Opacity,
}: Props) {
  const translateYValues = [item0TranslateY, item1TranslateY, item2TranslateY];
  const opacityValues = [item0Opacity, item1Opacity, item2Opacity];

  return (
    <>
      {ITEMS.map((item, idx) => (
        <FurnitureItem
          key={item.id}
          source={item.source}
          tileX={item.tileX}
          tileY={item.tileY}
          translateY={translateYValues[idx]}
          opacity={opacityValues[idx]}
        />
      ))}
    </>
  );
}

interface FurnitureItemProps {
  source: number;
  tileX: number;
  tileY: number;
  translateY: SharedValue<number>;
  opacity: SharedValue<number>;
}

function FurnitureItem({ source, tileX, tileY, translateY, opacity }: FurnitureItemProps) {
  const { w, h } = getItemLayout(source);
  const pixelX = tileX * tentMap.tileWidth * TENT_SCALE;
  const pixelY = TENT_OFFSET_Y + tileY * tentMap.tileWidth * TENT_SCALE;

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Image
      source={source}
      style={[
        styles.item,
        {
          left: pixelX,
          top: pixelY,
          width: w,
          height: h,
        },
        animStyle,
      ]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  item: {
    position: 'absolute',
  },
});
