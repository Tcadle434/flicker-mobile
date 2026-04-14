/**
 * nativeAudioModule.ts
 *
 * TypeScript wrapper for native Swift audio engine.
 * Uses lazy module resolution so missing native linkage doesn't crash app startup.
 */

import { NativeEventEmitter, Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';
import type {
  AudioScene,
  ResetCustomAudioConfig,
  SessionAudioConfig,
  UiSoundName,
} from '../../types';

// MARK: - Types

export interface LayerConfig {
  layer: string;
  loopId: string;
  filename: string;
  volume: number;
}

export interface AudioState {
  state: 'stopped' | 'playing' | 'paused';
  masterVolume: number;
  isInitialized: boolean;
}

export interface AudioDebugState {
  scene: AudioScene;
  activePreset: string | null;
  appAmbientState: 'stopped' | 'playing' | 'paused';
  appAmbientPosition: number;
  playbackState: 'stopped' | 'playing' | 'paused';
  masterVolume: number;
  isMuted: boolean;
  activeMode: string | null;
}

export interface PlaybackStateEvent {
  state: 'playing' | 'paused' | 'stopped';
}

export interface ErrorEvent {
  message: string;
  code: string;
}

export interface LoopTransitionEvent {
  layer: string;
  loopId: string;
}

type EventEmitterCompatibleModule = {
  addListener?: (eventName: string) => void;
  removeListeners?: (count: number) => void;
};

type FlickerAudioModule = EventEmitterCompatibleModule & Record<string, any>;

let cachedModule: FlickerAudioModule | null | undefined;
let moduleUnavailableWarned = false;
let eventEmitter: NativeEventEmitter | null = null;

const noopSubscription = {
  remove: () => {},
};

function getNativeModule(): FlickerAudioModule | null {
  if (Platform.OS !== 'ios') return null;
  if (cachedModule !== undefined) return cachedModule;

  try {
    cachedModule = requireNativeModule('FlickerAudio') as FlickerAudioModule;

    // React Native's NativeEventEmitter expects these methods on the provided module.
    if (typeof cachedModule.addListener !== 'function') {
      cachedModule.addListener = () => {};
    }
    if (typeof cachedModule.removeListeners !== 'function') {
      cachedModule.removeListeners = () => {};
    }

    return cachedModule;
  } catch (error) {
    cachedModule = null;
    if (!moduleUnavailableWarned) {
      moduleUnavailableWarned = true;
      console.warn('[NativeAudioEngine] FlickerAudio native module unavailable');
    }
    return null;
  }
}

function getEventEmitter(): NativeEventEmitter | null {
  const module = getNativeModule();
  if (!module) return null;
  if (!eventEmitter) {
    eventEmitter = new NativeEventEmitter(module as any);
  }
  return eventEmitter;
}

function ensureNativeMethod(method: string): (...args: any[]) => Promise<any> {
  const module = getNativeModule();
  const nativeMethod = module?.[method];

  if (!module || typeof nativeMethod !== 'function') {
    throw new Error(`FlickerAudio native method unavailable: ${method}`);
  }

  return (...args: any[]) => nativeMethod(...args);
}

async function callNative<T>(method: string, args: any[] = []): Promise<T> {
  try {
    return await ensureNativeMethod(method)(...args);
  } catch (error) {
    console.error(`[NativeAudioEngine] ${method} error:`, error);
    throw error;
  }
}

// MARK: - Native Audio Engine API

export const NativeAudioEngine = {
  // MARK: - Lifecycle

  initialize: async (): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('initialize');
  },

  configureShellAssets: async (
    ambientAsset: string | null,
    uiSounds: Record<string, string>,
  ): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('configureShellAssets', [ambientAsset, uiSounds]);
  },

  prewarmAssets: async (assetIds: string[]): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('prewarmAssets', [assetIds]);
  },

  dispose: async (): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('dispose');
  },

  enterScene: async (scene: AudioScene): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('enterScene', [scene]);
  },

  startSession: async (
    config: SessionAudioConfig,
    layers: LayerConfig[],
  ): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('startSession', [config, layers]);
  },

  switchResetPreset: async (
    preset: string,
    layers: LayerConfig[],
  ): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('switchResetPreset', [preset, layers]);
  },

  applyResetCustomConfig: async (
    config: ResetCustomAudioConfig,
    layers: LayerConfig[],
  ): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('applyResetCustomConfig', [config, layers]);
  },

  setSessionPhase: async (phase: string): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setSessionPhase', [phase]);
  },

  endSession: async (reason: string): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('endSession', [reason]);
  },

  // MARK: - Playback Control

  play: async (): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('play');
  },

  pause: async (): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('pause');
  },

  stop: async (): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('stop');
  },

  // MARK: - Volume Control

  setMasterVolume: async (volume: number, fadeMs: number = 0): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setMasterVolume', [volume, fadeMs]);
  },

  setMuted: async (muted: boolean): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setMuted', [muted]);
  },

  setLayerVolume: async (
    layer: string,
    volume: number,
    fadeMs: number = 0
  ): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setLayerVolume', [layer, volume, fadeMs]);
  },

  setLayerMuted: async (layer: string, muted: boolean): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setLayerMuted', [layer, muted]);
  },

  setLayerLoop: async (
    layer: string,
    loopId: string,
    filename: string,
    volume: number,
    fadeMs: number = 0,
  ): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setLayerLoop', [layer, loopId, filename, volume, fadeMs]);
  },

  // MARK: - Mode Loading

  loadMode: async (mode: string, layers: LayerConfig[]): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('loadMode', [mode, layers]);
  },

  playOneShot: async (name: UiSoundName): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('playOneShot', [name]);
  },

  // MARK: - State Query

  getState: async (): Promise<AudioState> => {
    try {
      return await callNative<AudioState>('getState');
    } catch {
      return { state: 'stopped', masterVolume: 0, isInitialized: false };
    }
  },

  getDebugState: async (): Promise<AudioDebugState> => {
    try {
      return await callNative<AudioDebugState>('getDebugState');
    } catch {
      return {
        scene: 'backgrounded',
        activePreset: null,
        appAmbientState: 'stopped',
        appAmbientPosition: 0,
        playbackState: 'stopped',
        masterVolume: 0,
        isMuted: false,
        activeMode: null,
      };
    }
  },

  // MARK: - Test Tone (Phase 1)

  playTestTone: async (frequency: number = 440, duration: number = 10): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('playTestTone', [frequency, duration]);
  },

  enableMultiLayerMode: async (): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('loadMode', [
      'test',
      [
        { layer: 'ambient', loopId: 'test', filename: 'test.wav', volume: 0.7 },
        { layer: 'nature', loopId: 'test', filename: 'test.wav', volume: 0.5 },
        { layer: 'melody', loopId: 'test', filename: 'test.wav', volume: 0.6 },
        { layer: 'rhythm', loopId: 'test', filename: 'test.wav', volume: 0.4 },
        { layer: 'binaural', loopId: 'test', filename: 'test.wav', volume: 0.3 },
      ],
    ]);
  },

  // MARK: - Effects Control (Phase 4)

  setReverbEnabled: async (enabled: boolean): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setReverbEnabled', [enabled]);
  },

  setReverbWetDryMix: async (mix: number): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setReverbWetDryMix', [mix]);
  },

  setReverbRoomSize: async (size: number): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setReverbRoomSize', [size]);
  },

  setFilterEnabled: async (enabled: boolean): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setFilterEnabled', [enabled]);
  },

  setFilterCutoff: async (frequency: number): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setFilterCutoff', [frequency]);
  },

  setCompressorEnabled: async (enabled: boolean): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setCompressorEnabled', [enabled]);
  },

  setCompressorWetDryMix: async (mix: number): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('setCompressorWetDryMix', [mix]);
  },

  applyEffectsPreset: async (preset: string): Promise<{ success: boolean }> => {
    return callNative<{ success: boolean }>('applyEffectsPreset', [preset]);
  },

  // MARK: - Event Listeners

  addPlaybackStateListener: (callback: (event: PlaybackStateEvent) => void) => {
    const emitter = getEventEmitter();
    if (!emitter) return noopSubscription;
    return emitter.addListener('playbackStateChanged', callback);
  },

  addErrorListener: (callback: (event: ErrorEvent) => void) => {
    const emitter = getEventEmitter();
    if (!emitter) return noopSubscription;
    return emitter.addListener('error', callback);
  },

  addLoopTransitionListener: (callback: (event: LoopTransitionEvent) => void) => {
    const emitter = getEventEmitter();
    if (!emitter) return noopSubscription;
    return emitter.addListener('loopTransitioned', callback);
  },

  removeAllListeners: () => {
    const emitter = getEventEmitter();
    if (!emitter) return;
    emitter.removeAllListeners('playbackStateChanged');
    emitter.removeAllListeners('error');
    emitter.removeAllListeners('loopTransitioned');
  },
};

export default NativeAudioEngine;
