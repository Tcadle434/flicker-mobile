import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEvent, useEventListener } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ONBOARDING_ASSETS } from '../onboardingAssets';
import { audioCoordinator } from '../../../services/audio/audioCoordinator';

interface Props {
  onNext: () => void;
}

const DEMO_SUPPRESSION_REASON = 'onboardingDemo' as const;

export default function StepCinematicDemo({ onNext }: Props) {
  const isMountedRef = useRef(true);
  const playbackStartedRef = useRef(false);
  const shellAudioResumedRef = useRef(false);
  const playbackCompletedRef = useRef(false);
  const hasAdvancedRef = useRef(false);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [shellAudioSuppressed, setShellAudioSuppressed] = useState(false);

  const player = useVideoPlayer(ONBOARDING_ASSETS.flickerAppDemoVideo, (instance) => {
    instance.currentTime = 0;
    instance.muted = false;
    instance.loop = false;
    instance.staysActiveInBackground = false;
  });

  const { status } = useEvent(player, 'statusChange', { status: player.status });

  const resumeShellAudio = useCallback(async () => {
    if (shellAudioResumedRef.current) {
      return;
    }

    shellAudioResumedRef.current = true;
    await audioCoordinator.resumeShellAudio(DEMO_SUPPRESSION_REASON);
  }, []);

  const safeResetPlayer = useCallback(() => {
    try {
      player.pause();
    } catch {
      // The native shared object may already be gone during unmount.
    }

    try {
      player.currentTime = 0;
    } catch {
      // Ignore teardown races with native player disposal.
    }
  }, [player]);

  const advanceToNext = useCallback(() => {
    if (hasAdvancedRef.current || !isMountedRef.current) {
      return;
    }

    hasAdvancedRef.current = true;
    onNext();
  }, [onNext]);

  useEffect(() => {
    isMountedRef.current = true;
    shellAudioResumedRef.current = false;
    playbackCompletedRef.current = false;
    playbackStartedRef.current = false;
    hasAdvancedRef.current = false;
    setHasError(false);
    setIsReady(false);
    setShellAudioSuppressed(false);

    void (async () => {
      try {
        await audioCoordinator.suspendShellAudio(DEMO_SUPPRESSION_REASON);
      } catch {
        // Allow playback to continue even if shell suppression fails.
      } finally {
        if (isMountedRef.current) {
          setShellAudioSuppressed(true);
        }
      }
    })();

    return () => {
      isMountedRef.current = false;
      safeResetPlayer();
      void resumeShellAudio().catch(() => undefined);
    };
  }, [resumeShellAudio, safeResetPlayer]);

  useEffect(() => {
    if (status === 'readyToPlay') {
      setIsReady(true);

      if (
        shellAudioSuppressed &&
        !playbackStartedRef.current &&
        !playbackCompletedRef.current &&
        !hasError
      ) {
        playbackStartedRef.current = true;
        player.play();
      }

      return;
    }

    if (status === 'error') {
      setHasError(true);
      void (async () => {
        await resumeShellAudio().catch(() => undefined);
        advanceToNext();
      })();
    }
  }, [advanceToNext, hasError, player, resumeShellAudio, shellAudioSuppressed, status]);

  useEventListener(player, 'playToEnd', () => {
    if (playbackCompletedRef.current) {
      return;
    }

    playbackCompletedRef.current = true;
    void (async () => {
      safeResetPlayer();
      await resumeShellAudio().catch(() => undefined);
      advanceToNext();
    })();
  });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying) {
      setIsReady(true);
    }
  });

  return (
    <View style={styles.root}>
      <VideoView
        player={player}
        style={styles.video}
        contentFit="contain"
        nativeControls={false}
      />

      {!hasError && (
        <View style={styles.overlay} pointerEvents="none">
          {!isReady && (
            <Animated.View entering={FadeIn.duration(250)} style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#FAF7F2" />
              <Text style={styles.loadingText}>Loading demo...</Text>
            </Animated.View>
          )}
        </View>
      )}

      {hasError && (
        <View style={styles.overlay} pointerEvents="none">
          <Animated.View entering={FadeIn.duration(200)} style={styles.loadingCard}>
            <Text style={styles.errorText}>Skipping demo...</Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
    backgroundColor: '#000000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(10, 10, 11, 0.78)',
  },
  loadingText: {
    marginTop: 12,
    color: '#FAF7F2',
    fontSize: 15,
    fontWeight: '500',
  },
  errorText: {
    color: 'rgba(255, 244, 232, 0.82)',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
