/**
 * DemoShopOverlay
 *
 * Simplified visual clone of TentShopPopup for the cinematic demo.
 * Shows 3 items in a PixelPanel with the shop label.
 * Parent controls visibility via shared values.
 */

import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated';
import PixelPanel from '../../hud/PixelPanel';
import { ONBOARDING_ASSETS } from '../onboardingAssets';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = SCREEN_W - 80;
const PANEL_H = 280;

const DEMO_ITEMS = [
  { name: 'Potted Plant', price: 15, source: ONBOARDING_ASSETS.pottedPlant },
  { name: 'Floor Lamp', price: 25, source: ONBOARDING_ASSETS.floorLamp },
  { name: 'Bookshelf', price: 40, source: ONBOARDING_ASSETS.bookshelf },
];

interface Props {
  shopOpacity: SharedValue<number>;
  shopTranslateY: SharedValue<number>;
}

export default function DemoShopOverlay({ shopOpacity, shopTranslateY }: Props) {
  const containerStyle = useAnimatedStyle(() => ({
    opacity: shopOpacity.value,
    transform: [{ translateY: shopTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, containerStyle]} pointerEvents="none">
      <View style={styles.center}>
        {/* Shop label */}
        <View style={styles.shopLabelWrap}>
          <Image
            source={require('../../../../assets/ui/shop_label.png')}
            style={styles.shopLabel}
            resizeMode="stretch"
          />
          <Text style={styles.shopLabelText}>Shop</Text>
        </View>

        {/* Panel */}
        <PixelPanel style={{ width: PANEL_W, height: PANEL_H }} inset={8}>
          {/* Category pill */}
          <View style={styles.categoryWrap}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>All</Text>
              <Text style={styles.categoryCaret}>{'\u25BC'}</Text>
            </View>
          </View>

          {/* Item grid */}
          <View style={styles.grid}>
            {DEMO_ITEMS.map((item) => (
              <View key={item.name} style={styles.shopItem}>
                <PixelPanel scale={1} style={styles.itemImageWrap}>
                  <Image
                    source={item.source}
                    style={styles.itemThumb}
                    resizeMode="contain"
                  />
                </PixelPanel>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.buyBtn}>
                  <Text style={styles.buyText}>{item.price}</Text>
                </View>
              </View>
            ))}
          </View>
        </PixelPanel>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
  },
  shopLabelWrap: {
    width: PANEL_W,
    height: PANEL_W * (128 / 320),
    marginBottom: -20,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopLabel: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  shopLabelText: {
    color: '#3B2A1A',
    fontFamily: 'Toriko',
    fontSize: 42,
    letterSpacing: 1,
    marginTop: -16,
    textShadowColor: 'rgba(255, 220, 160, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  categoryWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 42, 26, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 6,
  },
  categoryText: {
    color: '#3B2A1A',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryCaret: {
    color: '#3B2A1A',
    fontSize: 8,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 4,
  },
  shopItem: {
    width: 85,
    alignItems: 'center',
    gap: 3,
  },
  itemImageWrap: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemThumb: {
    width: 40,
    height: 40,
    alignSelf: 'center',
  },
  itemName: {
    color: '#3B2A1A',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  buyBtn: {
    backgroundColor: 'rgba(59, 42, 26, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 6,
  },
  buyText: {
    color: '#3B2A1A',
    fontSize: 12,
    fontWeight: '700',
  },
});
