import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { usePlayerStore } from '../../src/stores/playerStore';
import { Card } from '../../src/components/ui/Card';
import { Slider } from '../../src/components/ui/Slider';
import { Button } from '../../src/components/ui/Button';
import type { AudioLayer } from '../../src/types';

const LAYER_CONFIG: Record<
  AudioLayer,
  { name: string; icon: string; color: string; description: string }
> = {
  ambient: {
    name: 'Ambient',
    icon: '∿',
    color: '#8B5CF6',
    description: 'Foundation pads and drones',
  },
  nature: {
    name: 'Nature',
    icon: '🌿',
    color: '#10B981',
    description: 'Environmental sounds',
  },
  melody: {
    name: 'Melody',
    icon: '♪',
    color: '#F59E0B',
    description: 'Musical elements',
  },
  rhythm: {
    name: 'Rhythm',
    icon: '⊙',
    color: '#EF4444',
    description: 'Pulses and beats',
  },
  synthesis: {
    name: 'Synthesis',
    icon: '◊',
    color: '#2DD4BF',
    description: 'Binaural tones',
  },
};

export default function Mixer() {
  const {
    mode,
    adaptiveEnabled,
    layers,
    masterVolume,
    setMode,
    play,
    toggleAdaptive,
    setLayerVolume,
    setLayerMuted,
    setMasterVolume,
  } = usePlayerStore();

  const layerIds: AudioLayer[] = ['ambient', 'nature', 'melody', 'rhythm', 'synthesis'];

  const handleLayerVolumeChange = (layer: AudioLayer, value: number) => {
    setLayerVolume(layer, value);
  };

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
  };

  const handleMuteToggle = (layer: AudioLayer) => {
    setLayerMuted(layer, !layers[layer].muted);
  };

  const handleAuditionMix = async () => {
    if (adaptiveEnabled) {
      toggleAdaptive();
    }

    if (mode !== 'focus') {
      await setMode('focus');
    }

    setMasterVolume(0.8);

    setLayerMuted('ambient', false);
    setLayerMuted('nature', false);
    setLayerMuted('melody', false);
    setLayerMuted('rhythm', true);
    setLayerMuted('synthesis', true);

    setLayerVolume('ambient', 0.7);
    setLayerVolume('nature', 0.15);
    setLayerVolume('melody', 0.22);

    await play();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Audio Mixer</Text>
        <Text style={styles.subtitle}>Control individual audio layers</Text>
      </View>

      <Card glass style={styles.auditionCard}>
        <Text style={styles.auditionTitle}>🎧 Audition Stack</Text>
        <Text style={styles.auditionText}>
          Starts Focus with only Ambient + Nature + Melody (adaptive off)
        </Text>
        <Button title="Play Audition Mix" onPress={() => void handleAuditionMix()} fullWidth />
      </Card>

      {/* Master Volume */}
      <Card glass style={styles.masterCard}>
        <View style={styles.masterHeader}>
          <Text style={styles.masterLabel}>Master Volume</Text>
          <Text style={styles.masterValue}>{Math.round(masterVolume * 100)}%</Text>
        </View>
        <Slider
          value={masterVolume}
          onValueChange={handleMasterVolumeChange}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
        />
      </Card>

      {/* Layer Controls */}
      <View style={styles.layersSection}>
        <Text style={styles.sectionTitle}>Layers</Text>

        {layerIds.map((layerId) => {
          const layer = layers[layerId];
          const config = LAYER_CONFIG[layerId];

          return (
            <Card key={layerId} glass style={styles.layerCard}>
              <View style={styles.layerHeader}>
                <View style={styles.layerInfo}>
                  <Text style={[styles.layerIcon, { color: config.color }]}>
                    {config.icon}
                  </Text>
                  <View>
                    <Text style={styles.layerName}>{config.name}</Text>
                    <Text style={styles.layerDescription}>{config.description}</Text>
                  </View>
                </View>

                <View style={styles.layerControls}>
                  <Text style={styles.layerValue}>
                    {Math.round(layer.volume * 100)}%
                  </Text>
                  <TouchableOpacity
                    style={[styles.muteButton, layer.muted && styles.muteButtonActive]}
                    onPress={() => handleMuteToggle(layerId)}
                  >
                    <Text style={styles.muteButtonText}>
                      {layer.muted ? '🔇' : '🔊'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Slider
                value={layer.volume}
                onValueChange={(value) => handleLayerVolumeChange(layerId, value)}
                minimumValue={0}
                maximumValue={1}
                step={0.01}
                disabled={layer.muted}
              />

              {layer.currentLoopId && (
                <Text style={styles.currentLoop}>
                  Playing: {layer.currentLoopId}
                </Text>
              )}
            </Card>
          );
        })}
      </View>

      {/* Instructions */}
      <Card glass style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>💡 Mixer Tips</Text>
        <Text style={styles.instructionsText}>
          • Adjust individual layer volumes to create your perfect mix{'\n'}
          • Mute layers you don't want to hear{'\n'}
          • Master volume controls overall output{'\n'}
          • Layer changes happen in real-time
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FAFAFA',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
  },
  auditionCard: {
    padding: 20,
    marginBottom: 24,
  },
  auditionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FAFAFA',
    marginBottom: 8,
  },
  auditionText: {
    fontSize: 14,
    color: '#A1A1AA',
    marginBottom: 16,
  },
  masterCard: {
    padding: 20,
    marginBottom: 32,
  },
  masterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  masterLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  masterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2DD4BF',
  },
  layersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FAFAFA',
    marginBottom: 16,
  },
  layerCard: {
    padding: 16,
    marginBottom: 12,
  },
  layerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  layerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  layerIcon: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  layerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAFAFA',
  },
  layerDescription: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  layerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  layerValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2DD4BF',
    minWidth: 45,
    textAlign: 'right',
  },
  muteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#27272A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButtonActive: {
    backgroundColor: '#EF4444',
  },
  muteButtonText: {
    fontSize: 18,
  },
  currentLoop: {
    fontSize: 11,
    color: '#52525B',
    marginTop: 8,
  },
  instructionsCard: {
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FAFAFA',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
  },
});
