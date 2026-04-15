/**
 * Settings Panel
 *
 * Bottom pull-up panel with profile, sound, focus settings, and links.
 * Uses BottomPanel shell for consistent gesture/animation behavior.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import BottomPanel from './BottomPanel';
import { useAuthStore } from '../../stores/authStore';
import { useAudioSettingsStore } from '../../stores/audioSettingsStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { appBlockingBridge } from '../../services/appBlocking/appBlockingBridge';

const { width: SCREEN_W } = Dimensions.get('window');

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function SettingsRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      style={styles.row}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      {value != null && <Text style={styles.rowValue}>{value}</Text>}
    </TouchableOpacity>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.linkBtn}>
      <Text style={styles.linkBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function SettingsPanel({ visible, onClose }: SettingsPanelProps) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const isMuted = useAudioSettingsStore((s) => s.isMuted);
  const toggleMute = useAudioSettingsStore((s) => s.toggleMute);
  const restorePurchases = useSubscriptionStore((s) => s.restorePurchases);

  const [displayName, setDisplayName] = useState('');

  const handleConfirmSignOut = async () => {
    await signOut();
    onClose();
    router.replace('/(auth)/signin');
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void handleConfirmSignOut();
        },
      },
    ]);
  };

  const handleRestorePurchases = async () => {
    const restored = await restorePurchases();
    Alert.alert(
      restored ? 'Purchases Restored' : 'Nothing to Restore',
      restored
        ? 'Your subscription access has been restored.'
        : 'No active subscription was found for this App Store account.',
    );
  };

  const handleEditBlockList = async () => {
    const authorized = await appBlockingBridge.isAuthorized();
    if (!authorized) {
      Alert.alert(
        'Screen Time Required',
        'Enable Screen Time access in Settings > Screen Time to manage allowed apps.',
        [{ text: 'OK' }]
      );
      return;
    }
    await appBlockingBridge.presentAppPicker();
  };

  return (
    <BottomPanel visible={visible} onClose={onClose} panelTopFraction={0.12}>
      <Text style={styles.title}>Settings</Text>

      {/* ── Profile ── */}
      <SectionLabel>Profile</SectionLabel>
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Email</Text>
        <Text style={styles.fieldValue}>{user?.email ?? 'Not signed in'}</Text>

        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Display Name</Text>
        <TextInput
          style={styles.nameInput}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Enter a display name"
          placeholderTextColor="#A89888"
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      {/* ── Sound ── */}
      <SectionLabel>Sound</SectionLabel>
      <View style={styles.sectionCard}>
        <ToggleRow label="Sound Effects" value={!isMuted} onToggle={toggleMute} />
      </View>

      {/* ── Focus Settings ── */}
      <SectionLabel>Focus Settings</SectionLabel>
      <View style={styles.sectionCard}>
        <SettingsRow
          label="Edit Allow / Block List"
          onPress={() => { void handleEditBlockList(); }}
        />
      </View>

      {/* ── Links ── */}
      <SectionLabel>More</SectionLabel>
      <View style={styles.sectionCard}>
        <View style={styles.linksGrid}>
          <LinkButton label="Restore Purchases" onPress={() => { void handleRestorePurchases(); }} />
          <LinkButton
            label="Privacy Policy"
            onPress={() => Linking.openURL('https://example.com/privacy')}
          />
          <LinkButton
            label="Terms of Service"
            onPress={() => Linking.openURL('https://example.com/terms')}
          />
          <LinkButton
            label="Feedback"
            onPress={() => Linking.openURL('mailto:support@example.com')}
          />
        </View>
      </View>

      {/* ── Sign Out ── */}
      <TouchableOpacity
        onPress={handleSignOut}
        activeOpacity={0.85}
        style={styles.signOutBtn}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </BottomPanel>
  );
}

const styles = StyleSheet.create({
  title: {
    color: '#3B2A1A',
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  sectionLabel: {
    color: '#8B7A6A',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: 'rgba(139, 100, 50, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 100, 50, 0.15)',
    padding: 14,
    marginBottom: 12,
  },
  fieldLabel: {
    color: '#8B7A6A',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  fieldValue: {
    color: '#3B2A1A',
    fontSize: 15,
    fontWeight: '500',
  },
  nameInput: {
    color: '#3B2A1A',
    fontSize: 15,
    fontWeight: '500',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139, 100, 50, 0.25)',
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    color: '#3B2A1A',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  rowValue: {
    color: '#8B7A6A',
    fontSize: 14,
    fontWeight: '500',
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(139, 100, 50, 0.2)',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: 'rgba(94, 160, 80, 0.5)',
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D4C4B0',
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
  },
  linksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  linkBtn: {
    width: (SCREEN_W - 80) / 2 - 4,
    height: 44,
    backgroundColor: 'rgba(139, 100, 50, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 100, 50, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkBtnText: {
    color: '#5C4A3A',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  signOutBtn: {
    marginTop: 8,
    alignSelf: 'center',
    width: Math.min(SCREEN_W - 72, 300),
    height: 50,
    backgroundColor: 'rgba(180, 60, 60, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(180, 60, 60, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#8B3A3A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
