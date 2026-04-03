/**
 * spotifyStore.ts
 *
 * Zustand store for Spotify Connect state management.
 */

import { create } from 'zustand';
import { spotifyService, type SpotifyTrackInfo } from '../services/spotify/spotifyService';

export type SpotifyConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SpotifyStore {
  connectionStatus: SpotifyConnectionStatus;
  isPlaying: boolean;
  currentTrack: SpotifyTrackInfo | null;
  error: string | null;

  // Actions
  connectSpotify: () => Promise<boolean>;
  disconnectSpotify: () => Promise<void>;
  resumePlayback: () => Promise<void>;
  pausePlayback: () => Promise<void>;
  refreshTrackInfo: () => Promise<void>;
}

export const useSpotifyStore = create<SpotifyStore>((set, get) => ({
  connectionStatus: 'disconnected',
  isPlaying: false,
  currentTrack: null,
  error: null,

  connectSpotify: async () => {
    set({ connectionStatus: 'connecting', error: null });
    try {
      const connected = await spotifyService.ensureConnected();
      if (connected) {
        set({ connectionStatus: 'connected' });
        // Fetch initial track info
        const track = await spotifyService.getPlayerState();
        if (track) {
          set({ currentTrack: track, isPlaying: !track.isPaused });
        }
        return true;
      } else {
        set({ connectionStatus: 'disconnected' });
        return false;
      }
    } catch (error) {
      set({
        connectionStatus: 'error',
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      return false;
    }
  },

  disconnectSpotify: async () => {
    await spotifyService.disconnect();
    set({
      connectionStatus: 'disconnected',
      isPlaying: false,
      currentTrack: null,
      error: null,
    });
  },

  resumePlayback: async () => {
    await spotifyService.resume();
    set({ isPlaying: true });
  },

  pausePlayback: async () => {
    await spotifyService.pause();
    set({ isPlaying: false });
  },

  refreshTrackInfo: async () => {
    const track = await spotifyService.getPlayerState();
    if (track) {
      set({ currentTrack: track, isPlaying: !track.isPaused });
    }
  },
}));
