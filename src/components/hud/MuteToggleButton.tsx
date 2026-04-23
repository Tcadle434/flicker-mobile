import React from 'react';
import { TouchableOpacity, Image, View, StyleSheet } from 'react-native';
import { useAudioSettingsStore } from '../../stores/audioSettingsStore';
import { HUD_ASSETS } from './hudAssets';
import { playSound } from '../../services/audio/uiSounds';
import { audioCoordinator } from '../../services/audio/audioCoordinator';
import PixelPanel from './PixelPanel';

export default function MuteToggleButton() {
  const shellMuted = useAudioSettingsStore((s) => s.shellMuted);
  const setShellMuted = useAudioSettingsStore((s) => s.setShellMuted);

  const handlePress = () => {
    if (!shellMuted) {
      // About to mute — play sound first so user hears it
      playSound('buttonPress');
      setShellMuted(true);
      void audioCoordinator.setShellMuted(true).catch(() => undefined);
    } else {
      // About to unmute — toggle first, then play so it's audible
      setShellMuted(false);
      void audioCoordinator.setShellMuted(false).catch(() => undefined);
      playSound('buttonPress');
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <PixelPanel scale={1} style={styles.container}>
        <View style={styles.iconWrap}>
          <Image
            source={shellMuted ? HUD_ASSETS.volumeMuted : HUD_ASSETS.volumeUnmuted}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
      </PixelPanel>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
  },
  iconWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
});
