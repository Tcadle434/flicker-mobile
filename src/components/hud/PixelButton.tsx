import React from 'react';
import {
  TouchableOpacity,
  Image,
  Text,
  View,
  StyleSheet,
  type ImageSourcePropType,
  type ViewStyle,
} from 'react-native';

interface PixelButtonProps {
  imageSource: ImageSourcePropType | null;
  /** Text rendered on top of the image (e.g. "Start") */
  label?: string;
  /** Text shown only when imageSource is null (fallback mode) */
  fallbackLabel: string;
  width: number;
  height: number;
  onPress: () => void;
  style?: ViewStyle;
}

export default function PixelButton({
  imageSource,
  label,
  fallbackLabel,
  width,
  height,
  onPress,
  style,
}: PixelButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[{ width, height }, style]}
    >
      {imageSource ? (
        <View style={styles.fill}>
          <Image
            source={imageSource}
            style={{ width, height }}
            resizeMode="stretch"
          />
          {label && (
            <View style={styles.labelOverlay}>
              <Text style={styles.imageLabel}>{label}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.fallback, { width, height, borderRadius: height > 54 ? 10 : 8 }]}>
          <Text style={[styles.fallbackText, height <= 54 && styles.fallbackTextSmall]}>
            {fallbackLabel}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  labelOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLabel: {
    color: '#3B2A1A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 220, 160, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  fallback: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  fallbackTextSmall: {
    fontSize: 9,
  },
});
