import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { usePlayerStore } from '../../src/stores/playerStore';
import { Card } from '../../src/components/ui/Card';

const MODES = [
  {
    id: 'focus',
    name: 'Focus',
    description: 'Enhanced concentration and productivity',
    color: '#2DD4BF',
  },
  {
    id: 'relax',
    name: 'Relax',
    description: 'Deep relaxation and calm',
    color: '#60A5FA',
  },
  {
    id: 'sleep',
    name: 'Sleep',
    description: 'Peaceful sleep and rest',
    color: '#A78BFA',
  },
] as const;

export default function Modes() {
  const { mode, setMode } = usePlayerStore();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>Modes</Text>
      <Text style={styles.subtitle}>Choose a soundscape</Text>

      <View style={styles.modesList}>
        {MODES.map((item) => {
          const isActive = mode === item.id;
          return (
            <TouchableOpacity key={item.id} onPress={() => void setMode(item.id)}>
              <Card glass style={[styles.modeCard, isActive && styles.modeCardActive]}>
                <View style={styles.modeHeader}>
                  <Text style={[styles.modeName, { color: item.color }]}>{item.name}</Text>
                  {isActive && <Text style={styles.activeBadge}>ACTIVE</Text>}
                </View>
                <Text style={styles.modeDescription}>{item.description}</Text>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0B',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#FAFAFA',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A1A1AA',
    textAlign: 'center',
    marginBottom: 24,
  },
  modesList: {
    gap: 16,
  },
  modeCard: {
    padding: 20,
  },
  modeCardActive: {
    borderColor: '#2DD4BF',
    borderWidth: 1,
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeName: {
    fontSize: 20,
    fontWeight: '700',
  },
  modeDescription: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2DD4BF',
  },
});
