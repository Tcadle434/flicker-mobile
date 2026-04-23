import { AppStateStatus, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import NativeAudioEngine, { type LayerConfig } from './nativeAudioModule';
import { getPerfCounters, perfMark } from '../../lib/perfDiagnostics';
import {
  buildModeLayerState,
  buildResetSessionLayerState,
  createInitialResetSessionState,
  getLayerSelections,
  getLayerVolumes,
  usePlayerStore,
} from '../../stores/playerStore';
import { useAudioSettingsStore } from '../../stores/audioSettingsStore';
import type {
  AudioLayer,
  AudioScene,
  ResetSessionAudioMode,
  SessionAudioConfig,
  SessionAudioPreset,
  SoundscapeMode,
  UiSoundName,
} from '../../types';

const isSessionScene = (scene: AudioScene) =>
  scene === 'focusSession' || scene === 'resetSession' || scene === 'moveSession';

const mapLayerToNative = (layer: AudioLayer) => (layer === 'synthesis' ? 'binaural' : layer);

const mapResetPresetToMode = (preset: SessionAudioPreset): ResetSessionAudioMode => {
  switch (preset) {
    case 'resetBinauralBeats':
      return 'binauralBeats';
    case 'reset432hz':
    default:
      return '432hz';
  }
};

class AudioCoordinator {
  private initialized = false;
  private initializing: Promise<void> | null = null;
  private currentScene: AudioScene = 'backgrounded';
  private lastForegroundScene: AudioScene = 'shell';
  private appState: AppStateStatus = 'active';
  private sessionPreset: SessionAudioPreset | null = null;
  private pendingFadeOut: ReturnType<typeof setTimeout> | null = null;
  private shellAssetsConfigured = false;
  private shellAssetsPromise: Promise<void> | null = null;
  private shellAudioSuppressions = new Set<string>();

  private getShellMuted(): boolean {
    return useAudioSettingsStore.getState().shellMuted;
  }

  private getSessionMuted(): boolean {
    return useAudioSettingsStore.getState().sessionMuted;
  }

  private getEffectiveSessionMasterVolume(volume: number): number {
    return this.getSessionMuted() ? 0 : volume;
  }

  private hasActiveSessionAudio(): boolean {
    return isSessionScene(this.currentScene) || isSessionScene(this.lastForegroundScene);
  }

  private getEffectiveScene(scene: AudioScene): AudioScene {
    if (this.appState !== 'active') {
      return 'backgrounded';
    }

    if (scene === 'shell' && this.shellAudioSuppressions.size > 0) {
      return 'backgrounded';
    }

    return scene;
  }

  private async ensureInitialized(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    if (this.initialized) {
      return;
    }

    if (!this.initializing) {
      this.initializing = (async () => {
        await NativeAudioEngine.initialize();
        this.initialized = true;
        await NativeAudioEngine.setShellMuted(this.getShellMuted());
        await NativeAudioEngine.setSessionMuted(this.getSessionMuted());
      })().finally(() => {
        this.initializing = null;
      });
    }

    await this.initializing;
  }

  private clearPendingPhaseWork(): void {
    if (this.pendingFadeOut) {
      clearTimeout(this.pendingFadeOut);
      this.pendingFadeOut = null;
    }
  }

  private async applyScene(scene: AudioScene): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    await this.ensureShellAssetsConfigured();
    if (isSessionScene(scene) || isSessionScene(this.currentScene)) {
      await this.ensureInitialized();
    }
    const nextScene = this.getEffectiveScene(scene);
    this.currentScene = nextScene;
    perfMark('audio:scene-transition', {
      from: this.lastForegroundScene,
      to: nextScene,
    });
    await NativeAudioEngine.enterScene(nextScene);
  }

  private async ensureShellAssetsConfigured(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    if (this.shellAssetsConfigured) {
      return;
    }

    if (!this.shellAssetsPromise) {
      this.shellAssetsPromise = (async () => {
        const [ambientAsset, buttonPressAsset, shopOpenAsset, dialogueAsset] =
          await Asset.loadAsync([
            require('../../../assets/audio/main_app_background_music.m4a'),
            require('../../../assets/audio/ui_sounds/button_press.mp3'),
            require('../../../assets/audio/ui_sounds/shop_open.mp3'),
            require('../../../assets/audio/ui_sounds/dialogue_continue_press.mp3'),
          ]);

        const resolveLocalPath = async (asset: Asset) => {
          if (!asset.localUri) {
            await asset.downloadAsync();
          }
          return asset.localUri ?? null;
        };

        await NativeAudioEngine.configureShellAssets(await resolveLocalPath(ambientAsset), {
          buttonPress: (await resolveLocalPath(buttonPressAsset)) ?? '',
          shopOpen: (await resolveLocalPath(shopOpenAsset)) ?? '',
          dialogueContinue: (await resolveLocalPath(dialogueAsset)) ?? '',
        });

        this.shellAssetsConfigured = true;
      })().finally(() => {
        this.shellAssetsPromise = null;
      });
    }

    await this.shellAssetsPromise;
  }

  private async applyNativeMixState(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    const playerState = usePlayerStore.getState();
    await NativeAudioEngine.setMasterVolume(
      this.getEffectiveSessionMasterVolume(playerState.masterVolume),
      0,
    );

    const layerEntries = Object.entries(playerState.layers) as Array<
      [AudioLayer, (typeof playerState.layers)[AudioLayer]]
    >;

    for (const [layer, layerState] of layerEntries) {
      await NativeAudioEngine.setLayerVolume(
        mapLayerToNative(layer),
        layerState.volume,
        0,
      );
      await NativeAudioEngine.setLayerMuted(mapLayerToNative(layer), layerState.muted);
    }
  }

  private buildFocusLayers(mode: SoundscapeMode): LayerConfig[] {
    const state = usePlayerStore.getState();
    const next = buildModeLayerState(
      state.layers,
      mode,
      getLayerSelections(state.layers),
      getLayerVolumes(state.layers),
    );

    usePlayerStore.setState({
      mode,
      layers: next.layers,
    });

    return next.layerConfigs;
  }

  private buildResetLayers(mode: ResetSessionAudioMode): LayerConfig[] {
    const state = usePlayerStore.getState();
    const nextSelections = {
      ...state.resetSessionSelections,
      [mode]: {
        ...createInitialResetSessionState().resetSessionSelections[mode],
        ...state.resetSessionSelections[mode],
      },
    };
    const nextVolumes = {
      ...state.resetSessionVolumes,
      [mode]: {
        ...createInitialResetSessionState().resetSessionVolumes[mode],
        ...state.resetSessionVolumes[mode],
      },
    };
    const next = buildResetSessionLayerState(
      state.layers,
      mode,
      nextSelections[mode],
      nextVolumes[mode],
    );

    usePlayerStore.setState({
      mode: 'relax',
      resetSessionAudioMode: mode,
      resetSessionSelections: nextSelections,
      resetSessionVolumes: nextVolumes,
      layers: next.layers,
    });

    return next.layerConfigs;
  }

  async initialize(): Promise<void> {
    await this.ensureShellAssetsConfigured();
  }

  async enterShell(): Promise<void> {
    this.lastForegroundScene = 'shell';
    usePlayerStore.getState().stopAdaptiveLoop();
    await this.applyScene('shell');
  }

  async leaveShell(): Promise<void> {
    if (this.currentScene === 'shell' || this.lastForegroundScene === 'shell') {
      usePlayerStore.getState().stopAdaptiveLoop();
      await this.applyScene('backgrounded');
    }
  }

  async suspendShellAudio(reason: 'onboardingDemo'): Promise<void> {
    this.shellAudioSuppressions.add(reason);

    if (this.lastForegroundScene === 'shell' || this.currentScene === 'shell') {
      await this.applyScene('shell');
    }
  }

  async resumeShellAudio(reason: 'onboardingDemo'): Promise<void> {
    this.shellAudioSuppressions.delete(reason);

    if (this.shellAudioSuppressions.size > 0) {
      return;
    }

    if (this.lastForegroundScene === 'shell' || this.currentScene === 'backgrounded') {
      await this.applyScene(this.lastForegroundScene);
    }
  }

  async startFocusSession(config: SessionAudioConfig): Promise<void> {
    const mode = (config.modeLabel as SoundscapeMode | undefined) ?? 'focus';
    const playerStore = usePlayerStore.getState();

    useAudioSettingsStore.getState().setSessionMuted(false);
    playerStore.syncPlaybackState('loading');
    playerStore.stopAdaptiveLoop();
    this.clearPendingPhaseWork();
    this.sessionPreset = config.preset;
    this.lastForegroundScene = config.scene;

    if (Platform.OS !== 'ios') {
      if (config.preset === 'silent') {
        playerStore.syncPlaybackState('idle');
      } else {
        playerStore.prepareModeState(mode);
        playerStore.syncPlaybackState('playing');
      }
      this.currentScene = config.scene;
      return;
    }

    await this.ensureInitialized();
    await NativeAudioEngine.setSessionMuted(false);

    const layers =
      config.preset === 'silent'
        ? []
        : this.buildFocusLayers(mode);

    await NativeAudioEngine.startSession(
      { ...config, modeLabel: mode },
      layers,
    );
    await this.applyNativeMixState();

    playerStore.syncPlaybackState(
      config.preset === 'silent' ? 'idle' : 'playing',
    );
    this.currentScene = config.scene;
  }

  async startResetSession(config: SessionAudioConfig): Promise<void> {
    const playerStore = usePlayerStore.getState();
    const resetMode = mapResetPresetToMode(config.preset);

    useAudioSettingsStore.getState().setSessionMuted(false);
    playerStore.syncPlaybackState('loading');
    playerStore.stopAdaptiveLoop();
    this.clearPendingPhaseWork();
    this.sessionPreset = config.preset;
    this.lastForegroundScene = config.scene;

    if (Platform.OS !== 'ios') {
      playerStore.prepareResetSessionAudioModeState(resetMode);
      playerStore.syncPlaybackState('playing');
      this.currentScene = config.scene;
      return;
    }

    await this.ensureInitialized();
    await NativeAudioEngine.setSessionMuted(false);

    const layers = this.buildResetLayers(resetMode);

    await NativeAudioEngine.startSession(
      {
        ...config,
        modeLabel: `reset:${resetMode}`,
      },
      layers,
    );
    await this.applyNativeMixState();
    playerStore.syncPlaybackState('playing');
    this.currentScene = config.scene;
  }

  async switchResetPreset(
    preset: 'reset432hz' | 'resetBinauralBeats',
  ): Promise<void> {
    const playerStore = usePlayerStore.getState();
    const resetMode = mapResetPresetToMode(preset);

    playerStore.syncPlaybackState('loading');
    this.sessionPreset = preset;

    if (Platform.OS !== 'ios') {
      playerStore.prepareResetSessionAudioModeState(resetMode);
      playerStore.syncPlaybackState('playing');
      return;
    }

    await this.ensureInitialized();
    const layers = this.buildResetLayers(resetMode);

    await NativeAudioEngine.switchResetPreset(preset, layers);
    await this.applyNativeMixState();
    playerStore.syncPlaybackState('playing');
  }

  async setSessionPhase(phase: 'fade' | 'still' | 'return' | 'active' | 'complete'): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    await this.ensureInitialized();
    this.clearPendingPhaseWork();
    await NativeAudioEngine.setSessionPhase(phase);

    if (this.currentScene !== 'resetSession') {
      return;
    }

    if (phase === 'still') {
      await NativeAudioEngine.setMasterVolume(
        this.getEffectiveSessionMasterVolume(usePlayerStore.getState().masterVolume),
        0,
      );
      return;
    }

    if (phase === 'complete') {
      await this.endSession('completed');
    }
  }

  async endSession(reason: 'completed' | 'abandoned' | 'interrupted'): Promise<void> {
    this.clearPendingPhaseWork();
    this.sessionPreset = null;
    usePlayerStore.getState().syncPlaybackState('idle');
    usePlayerStore.getState().stopAdaptiveLoop();

    if (Platform.OS === 'ios') {
      await this.ensureInitialized();
      await NativeAudioEngine.endSession(reason);
    }

    this.lastForegroundScene = 'shell';
    await this.applyScene(this.appState === 'active' ? 'shell' : 'backgrounded');
  }

  async setShellMuted(muted: boolean): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    await NativeAudioEngine.setShellMuted(muted);
  }

  async setSessionMuted(muted: boolean): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    await NativeAudioEngine.setSessionMuted(muted);
    if (this.hasActiveSessionAudio()) {
      await this.applyNativeMixState();
    }
  }

  async setMasterVolume(volume: number): Promise<void> {
    usePlayerStore.setState({ masterVolume: volume });

    if (Platform.OS !== 'ios') {
      return;
    }

    await NativeAudioEngine.setMasterVolume(this.getEffectiveSessionMasterVolume(volume), 0);
  }

  async playUiSound(name: UiSoundName): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    if (this.shellAudioSuppressions.size > 0) {
      return;
    }

    if (this.appState !== 'active' || isSessionScene(this.currentScene)) {
      return;
    }

    if (this.getShellMuted()) {
      return;
    }

    await NativeAudioEngine.playOneShot(name);
  }

  async handleAppStateChange(state: AppStateStatus): Promise<void> {
    this.appState = state;

    if (state === 'active') {
      const nextScene = this.lastForegroundScene;
      await this.applyScene(nextScene);
      return;
    }

    if (state === 'inactive' || state === 'background') {
      usePlayerStore.getState().stopAdaptiveLoop();
      if (this.currentScene !== 'backgrounded') {
        this.lastForegroundScene = isSessionScene(this.currentScene) ? this.currentScene : this.lastForegroundScene;
      }
      await this.applyScene('backgrounded');
    }
  }

  async setFocusLayerLoop(layer: AudioLayer, loopId: string): Promise<void> {
    await usePlayerStore.getState().setLayerLoop(layer, loopId);
  }

  setFocusLayerVolume(layer: AudioLayer, volume: number): void {
    usePlayerStore.getState().setLayerVolume(layer, volume);
  }

  async cycleResetStandaloneTrack(direction: -1 | 1): Promise<void> {
    await usePlayerStore.getState().cycleResetSessionStandaloneTrack(direction);
  }

  setResetStandaloneVolume(volume: number): void {
    usePlayerStore.getState().setResetSessionStandaloneVolume(volume);
  }

  async getDebugState() {
    if (Platform.OS !== 'ios') {
      return null;
    }

    await this.ensureInitialized();
    const nativeState = await NativeAudioEngine.getDebugState();
    const playerState = usePlayerStore.getState();

    return {
      ...nativeState,
      adaptiveLoopRunning: playerState.adaptiveLoopRunning,
      shellAudioActive: nativeState.shellAudioActive ?? nativeState.scene === 'shell',
      sessionAudioActive:
        nativeState.sessionAudioActive ??
        (isSessionScene(nativeState.scene) && nativeState.playbackState === 'playing'),
      perfCounters: getPerfCounters(),
    };
  }
}

export const audioCoordinator = new AudioCoordinator();
