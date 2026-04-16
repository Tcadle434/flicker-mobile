import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@flicker/audio_settings';

interface AudioSettingsStore {
  isMuted: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
}

export const useAudioSettingsStore = create<AudioSettingsStore>((set, get) => ({
  isMuted: false,
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({ isMuted: !!parsed.isMuted, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch {
      set({ isHydrated: true });
    }
  },

  setMuted: (muted) => {
    set({ isMuted: muted });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ isMuted: muted })).catch(() => undefined);
  },

  toggleMute: () => {
    const next = !get().isMuted;
    get().setMuted(next);
  },
}));
