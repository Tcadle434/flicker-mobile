/**
 * spotifyService.ts
 *
 * Singleton wrapping react-native-spotify-remote for Spotify Connect integration.
 * Handles auth, connection, playback control, and state queries.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, NativeModules, Platform } from 'react-native';
import { config } from '../../constants/config';

const TOKEN_KEY = '@flicker:spotify_token';
let spotifyMissingWarningShown = false;

export interface SpotifyTrackInfo {
  name: string;
  artist: string;
  albumArt?: string;
  durationMs: number;
  positionMs: number;
  isPaused: boolean;
}

type SpotifyModule = {
  auth: {
    authorize: (input: {
      clientID: string;
      redirectURL: string;
      scopes: string[];
      showDialog: boolean;
    }) => Promise<{ accessToken: string }>;
  };
  remote: {
    connect: (accessToken: string) => Promise<void>;
    disconnect: () => Promise<void>;
    resume: () => Promise<void>;
    pause: () => Promise<void>;
    skipToNext: () => Promise<void>;
    getPlayerState: () => Promise<any>;
  };
};

function hasSpotifyNativeModule(): boolean {
  return Boolean(
    // Common native module names used by react-native-spotify-remote variants
    (NativeModules as any).RNSpotifyRemote ||
    (NativeModules as any).SpotifyRemote,
  );
}

function getSpotifyModule(): SpotifyModule | null {
  if (Platform.OS !== 'ios') return null;
  if (!hasSpotifyNativeModule()) return null;
  try {
    return require('react-native-spotify-remote') as SpotifyModule;
  } catch {
    if (!spotifyMissingWarningShown) {
      spotifyMissingWarningShown = true;
      console.warn('[SpotifyService] Native Spotify module unavailable. Spotify controls are disabled.');
    }
    return null;
  }
}

class SpotifyService {
  private static instance: SpotifyService;
  private isConnected = false;
  private token: string | null = null;

  private constructor() {}

  static getInstance(): SpotifyService {
    if (!SpotifyService.instance) {
      SpotifyService.instance = new SpotifyService();
    }
    return SpotifyService.instance;
  }

  isNativeAvailable(): boolean {
    return Platform.OS === 'ios' && hasSpotifyNativeModule();
  }

  // MARK: - Auth

  /**
   * Authenticate with Spotify via app-to-app redirect.
   * Requires Spotify app to be installed.
   */
  async authorize(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    const spotify = getSpotifyModule();
    if (!spotify) return false;

    try {
      const session = await spotify.auth.authorize({
        clientID: config.spotify.clientId,
        redirectURL: config.spotify.redirectUrl,
        scopes: [...config.spotify.scopes],
        showDialog: false,
      });

      this.token = session.accessToken;
      await AsyncStorage.setItem(TOKEN_KEY, session.accessToken);
      return true;
    } catch (error) {
      console.error('[SpotifyService] Auth error:', error);
      return false;
    }
  }

  // MARK: - Connection

  /**
   * Connect to Spotify remote player. Lazy-reconnects if token exists.
   */
  async connect(): Promise<boolean> {
    if (this.isConnected) return true;
    const spotify = getSpotifyModule();
    if (!spotify) return false;

    try {
      // Try stored token first
      if (!this.token) {
        this.token = await AsyncStorage.getItem(TOKEN_KEY);
      }

      if (!this.token) {
        // No token — need to authorize first
        return false;
      }

      await spotify.remote.connect(this.token);
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error('[SpotifyService] Connect error:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Ensure we're connected, re-authorizing if needed.
   */
  async ensureConnected(): Promise<boolean> {
    if (this.isConnected) return true;

    // Try connecting with existing token
    const connected = await this.connect();
    if (connected) return true;

    // Token expired or missing — re-authorize
    const authorized = await this.authorize();
    if (!authorized) return false;

    return this.connect();
  }

  /**
   * Disconnect from Spotify remote.
   */
  async disconnect(): Promise<void> {
    const spotify = getSpotifyModule();
    try {
      if (spotify) {
        await spotify.remote.disconnect();
      }
    } catch {
      // Ignore disconnect errors
    }
    this.isConnected = false;
    this.token = null;
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => undefined);
  }

  // MARK: - Playback Control

  async resume(): Promise<void> {
    const spotify = getSpotifyModule();
    if (!spotify) return;
    if (!await this.ensureConnected()) return;
    try {
      await spotify.remote.resume();
    } catch (error) {
      console.error('[SpotifyService] Resume error:', error);
    }
  }

  async pause(): Promise<void> {
    const spotify = getSpotifyModule();
    if (!spotify) return;
    if (!this.isConnected) return;
    try {
      await spotify.remote.pause();
    } catch (error) {
      console.error('[SpotifyService] Pause error:', error);
    }
  }

  async skipToNext(): Promise<void> {
    const spotify = getSpotifyModule();
    if (!spotify) return;
    if (!this.isConnected) return;
    try {
      await spotify.remote.skipToNext();
    } catch (error) {
      console.error('[SpotifyService] Skip error:', error);
    }
  }

  // MARK: - State

  async getPlayerState(): Promise<SpotifyTrackInfo | null> {
    const spotify = getSpotifyModule();
    if (!spotify) return null;
    if (!this.isConnected) return null;
    try {
      const state = await spotify.remote.getPlayerState();
      if (!state.track) return null;

      return {
        name: state.track.name,
        artist: state.track.artist.name,
        albumArt: state.track.album?.uri,
        durationMs: state.track.duration,
        positionMs: state.playbackPosition,
        isPaused: state.isPaused,
      };
    } catch (error) {
      console.error('[SpotifyService] GetPlayerState error:', error);
      return null;
    }
  }

  /**
   * Check if Spotify app is installed on the device.
   */
  async isSpotifyInstalled(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      return await Linking.canOpenURL('spotify://');
    } catch {
      return false;
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export const spotifyService = SpotifyService.getInstance();
export default spotifyService;
