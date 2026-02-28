import React from 'react';
import { TouchableOpacity, ImageBackground, Image, StyleSheet } from 'react-native';
import { useAudioSettingsStore } from '../../stores/audioSettingsStore';
import { HUD_ASSETS } from './hudAssets';
import { playSound } from '../../services/audio/uiSounds';

export default function MuteToggleButton() {
  const isMuted = useAudioSettingsStore((s) => s.isMuted);
  const toggleMute = useAudioSettingsStore((s) => s.toggleMute);

  const handlePress = () => {
    if (!isMuted) {
      // About to mute — play sound first so user hears it
      playSound('buttonPress');
      toggleMute();
    } else {
      // About to unmute — toggle first, then play so it's audible
      toggleMute();
      playSound('buttonPress');
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <ImageBackground
        source={HUD_ASSETS.itemShopBg}
        style={styles.container}
        resizeMode="contain"
      >
        <Image
          source={isMuted ? HUD_ASSETS.volumeMuted : HUD_ASSETS.volumeUnmuted}
          style={styles.icon}
          resizeMode="contain"
        />
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
});
