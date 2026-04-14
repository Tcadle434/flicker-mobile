import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import ContentScreen from '../ContentScreen';
import { useOnboardingStore } from '../../../stores/onboardingStore';
import { appBlockingBridge } from '../../../services/appBlocking/appBlockingBridge';
import { playSound } from '../../../services/audio/uiSounds';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props { onNext: () => void; }

export default function Step15ScreenTimeAuth({ onNext }: Props) {
  const setPermission = useOnboardingStore((s) => s.setPermission);
  const [isLoading, setIsLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  const handleEnable = useCallback(async () => {
    setIsLoading(true);
    setDenied(false);
    const alreadyAuthorized = await appBlockingBridge.isAuthorized();
    if (alreadyAuthorized) {
      setIsLoading(false);
      setPermission('screenTime', true);
      onNext();
      return;
    }
    const granted = await appBlockingBridge.requestAuthorization();
    setIsLoading(false);
    if (granted) {
      setPermission('screenTime', true);
      onNext();
    } else {
      setDenied(true);
    }
  }, [setPermission, onNext]);

  return (
    <ContentScreen backgroundColor="#F5F0EA">
      <View style={styles.header}>
        <Animated.Text entering={FadeInDown.delay(100).duration(500)} style={styles.title}>
          Almost there
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(250).duration(500)} style={styles.subtitle}>
          iOS will ask for Screen Time access. Tap{' '}
          <Text style={styles.subtitleBold}>Continue</Text>
          {' '}in the dialog to enable app blocking.
        </Animated.Text>
      </View>

      <View style={styles.content}>
        {/* Preview of the Apple system dialog — illustrative only */}
        <Animated.View entering={FadeIn.delay(400).duration(600)} style={styles.dialogCard}>
          <View style={styles.dialogIconRow}>
            <View style={styles.dialogIconBox}>
              <Text style={styles.dialogIconEmoji}>{'\u23F3'}</Text>
            </View>
          </View>
          <Text style={styles.dialogTitle}>
            {'\u201C'}Flicker{'\u201D'} Would Like to{'\n'}Access Screen Time
          </Text>
          <Text style={styles.dialogBody}>
            This allows Flicker to block distracting apps during your sessions and restore access when you're done.
          </Text>
          <View style={styles.dialogPreviewBadge}>
            <Text style={styles.dialogPreviewText}>iOS will prompt you next</Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(900).duration(400)}>
        <Pressable
          style={[styles.ctaButton, isLoading && styles.ctaButtonLoading]}
          onPress={() => { playSound('buttonPress'); void handleEnable(); }}
          disabled={isLoading}
        >
          <Text style={styles.ctaText}>
            {isLoading ? 'Requesting…' : denied ? 'Try Again' : 'Allow Access'}
          </Text>
        </Pressable>
        {denied && (
          <Text style={styles.deniedText}>
            Screen Time access is required to continue.{'\n'}Tap Try Again and allow access.
          </Text>
        )}
      </Animated.View>
    </ContentScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 68,
    paddingBottom: 4,
  },
  title: {
    color: '#1A1A1A',
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'left',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 16,
    fontWeight: '300',
    lineHeight: 23,
    textAlign: 'left',
  },
  subtitleBold: {
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.65)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  // Mock iOS system dialog
  dialogCard: {
    width: SCREEN_W - 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    // iOS-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  dialogTitle: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    lineHeight: 23,
  },
  dialogIconRow: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 4,
  },
  dialogIconBox: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogIconEmoji: {
    fontSize: 26,
  },
  dialogBody: {
    color: 'rgba(0, 0, 0, 0.5)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    lineHeight: 18,
  },
  dialogPreviewBadge: {
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 8,
    alignItems: 'center',
  },
  dialogPreviewText: {
    color: 'rgba(0, 0, 0, 0.35)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  ctaButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingVertical: 16,
  },
  ctaButtonLoading: {
    opacity: 0.45,
  },
  ctaText: {
    color: '#FAFAFA',
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  deniedText: {
    color: 'rgba(180, 60, 60, 0.75)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 12,
  },
});
