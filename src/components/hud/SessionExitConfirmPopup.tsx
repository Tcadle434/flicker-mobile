import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import PixelPanel from './PixelPanel';
import { HUD_ASSETS } from './hudAssets';

interface Props {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function SessionExitConfirmPopup({ visible, onConfirm, onCancel }: Props) {
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={styles.overlay} entering={FadeIn.duration(200)}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onCancel}
        />

        <Animated.View style={styles.center} entering={FadeInDown.duration(300)}>
          <PixelPanel style={styles.panel} inset={10}>
            <View style={styles.content}>
              <Text style={styles.title}>Exit Early?</Text>
              <Text style={styles.body}>
                You won't earn any Light for this session. Finish to earn your reward.
              </Text>

              <View style={styles.buttons}>
                <TouchableOpacity
                  onPress={onCancel}
                  activeOpacity={0.85}
                  style={styles.buttonWrap}
                >
                  <PixelPanel source={HUD_ASSETS.panelSlice2} scale={1} style={styles.buttonPanel}>
                    <View style={[styles.buttonInner, styles.keepButtonInner]}>
                      <Text style={[styles.buttonText, styles.keepText]}>Keep Going</Text>
                    </View>
                  </PixelPanel>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onConfirm}
                  activeOpacity={0.85}
                  style={styles.buttonWrap}
                >
                  <PixelPanel source={HUD_ASSETS.panelSlice2} scale={1} style={styles.buttonPanel}>
                    <View style={[styles.buttonInner, styles.exitButtonInner]}>
                      <Text style={[styles.buttonText, styles.exitText]}>Exit Anyway</Text>
                    </View>
                  </PixelPanel>
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
    width: 260,
    height: 208,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  title: {
    color: '#3B2A1A',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: '#5C4A3A',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  buttons: {
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  buttonWrap: {
    width: '100%',
    height: 46,
  },
  buttonPanel: {
    flex: 1,
  },
  buttonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepButtonInner: {
    backgroundColor: 'rgba(139, 100, 50, 0.18)',
  },
  exitButtonInner: {
    backgroundColor: 'rgba(139, 100, 50, 0.08)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  keepText: {
    color: '#2E2014',
  },
  exitText: {
    color: '#6E5A48',
  },
});
