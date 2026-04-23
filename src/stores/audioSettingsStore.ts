import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@flicker/audio_settings';

interface AudioSettingsStore {
  shellMuted: boolean;
  sessionMuted: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setShellMuted: (muted: boolean) => void;
  toggleShellMuted: () => void;
  setSessionMuted: (muted: boolean) => void;
}

export const useAudioSettingsStore = create<AudioSettingsStore>((set, get) => ({
  shellMuted: false,
  sessionMuted: false,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          shellMuted:
            typeof parsed.shellMuted === 'boolean'
              ? parsed.shellMuted
              : !!parsed.isMuted,
          sessionMuted: false,
          isHydrated: true,
        });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  setShellMuted: (muted) => {
    set({ shellMuted: muted });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ shellMuted: muted })).catch(() => undefined);
  },

  toggleShellMuted: () => {
    const next = !get().shellMuted;
    get().setShellMuted(next);
  },

  setSessionMuted: (muted) => {
    set({ sessionMuted: muted });
  },
}));
