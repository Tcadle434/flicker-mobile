import { create } from 'zustand';

interface SoundPadStore {
  visible: boolean;
  x: number; // -1 to 1
  y: number; // -1 to 1

  setPosition: (x: number, y: number) => void;
  toggle: () => void;
  reset: () => void;
}

export const useSoundPadStore = create<SoundPadStore>((set) => ({
  visible: false,
  x: 0,
  y: 0,

  setPosition: (x: number, y: number) => {
    set({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) });
  },

  toggle: () => {
    set((state) => ({ visible: !state.visible }));
  },

  reset: () => {
    set({ visible: false, x: 0, y: 0 });
  },
}));
