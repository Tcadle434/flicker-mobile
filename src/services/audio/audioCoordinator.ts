import { AppStateStatus, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import NativeAudioEngine, { type LayerConfig } from './nativeAudioModule';
import { logger } from '../../lib/logger';
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
  ResetCustomAudioConfig,
  ResetSessionAudioMode,
  SessionAudioConfig,
  SessionAudioPreset,
  SoundscapeMode,
  UiSoundName,
} from '../../types';

const PREWARM_ASSETS = [
  'focus_2.mp3',
  '432Hz_1.mp3',
  'binaural_beats_1.mp3',
] as const;

const RESET_RETURN_SECONDS = 25;
const RESET_RETURN_FADE_OUT_SECONDS = 8;

const isSessionScene = (scene: AudioScene) =>
  scene === 'focusSession' || scene === 'resetSession' || scene === 'moveSession';

const mapLayerToNative = (layer: AudioLayer) => (layer === 'synthesis' ? 'binaural' : layer);

const mapResetPresetToMode = (preset: SessionAudioPreset): ResetSessionAudioMode => {
  switch (preset) {
    case 'resetBinauralBeats':
      return 'binauralBeats';
    case 'resetCustom':
      return 'custom';
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
        await this.setMuted(useAudioSettingsStore.getState().isMuted);
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

    await this.ensureInitialized();
    await this.ensureShellAssetsConfigured();
    const nextScene = this.getEffectiveScene(scene);
    this.currentScene = nextScene;
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
    await NativeAudioEngine.setMasterVolume(playerState.masterVolume, 0);

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
    await this.ensureInitialized();
    await this.ensureShellAssetsConfigured();
    await this.prewarmDefaults();
  }

  async prewarmDefaults(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    await this.ensureInitialized();

    try {
      await NativeAudioEngine.prewarmAssets([...PREWARM_ASSETS]);
    } catch (error) {
      logger.warn('Audio prewarm failed', error);
    }
  }

  async enterShell(): Promise<void> {
    this.lastForegroundScene = 'shell';
    await this.applyScene('shell');
  }

  async leaveShell(): Promise<void> {
    if (this.currentScene === 'shell' || this.lastForegroundScene === 'shell') {
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

    playerStore.syncPlaybackState('loading');
    playerStore.ensureAdaptiveLoop();
    this.clearPendingPhaseWork();
    this.sessionPreset = config.preset;
    this.lastForegroundScene = config.scene;

    if (Platform.OS !== 'ios') {
      playerStore.prepareModeState(mode);
      playerStore.syncPlaybackState('playing');
      this.currentScene = config.scene;
      return;
    }

    await this.ensureInitialized();

    const layers =
      config.preset === 'silent' || config.preset === 'spotify'
        ? []
        : this.buildFocusLayers(mode);

    await NativeAudioEngine.startSession(
      { ...config, modeLabel: mode },
      layers,
    );
    await this.applyNativeMixState();
    if (layers.length > 0) {
      await usePlayerStore.getState().updateAdaptiveParameters();
    }

    playerStore.syncPlaybackState(
      config.preset === 'silent' || config.preset === 'spotify' ? 'idle' : 'playing',
    );
    this.currentScene = config.scene;
  }

  async startResetSession(config: SessionAudioConfig): Promise<void> {
    const playerStore = usePlayerStore.getState();
    const resetMode = mapResetPresetToMode(config.preset);

    playerStore.syncPlaybackState('loading');
    playerStore.ensureAdaptiveLoop();
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

    const layers = this.buildResetLayers(resetMode);

    await NativeAudioEngine.startSession(
      {
        ...config,
        modeLabel: `reset:${resetMode}`,
      },
      layers,
    );
    await this.applyNativeMixState();
    await usePlayerStore.getState().updateAdaptiveParameters();
    playerStore.syncPlaybackState('playing');
    this.currentScene = config.scene;
  }

  async switchResetPreset(
    preset: 'reset432hz' | 'resetBinauralBeats' | 'resetCustom',
  ): Promise<void> {
    const playerStore = usePlayerStore.getState();
    const resetMode = mapResetPresetToMode(preset);

    playerStore.syncPlaybackState('loading');
    playerStore.ensureAdaptiveLoop();
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
    await usePlayerStore.getState().updateAdaptiveParameters();
    playerStore.syncPlaybackState('playing');
  }

  async applyResetCustomConfig(config: ResetCustomAudioConfig): Promise<void> {
    const state = usePlayerStore.getState();
    const nextSelections = {
      ...state.resetSessionSelections,
      custom: {
        ...state.resetSessionSelections.custom,
        ...config.selections,
      },
    };
    const nextVolumes = {
      ...state.resetSessionVolumes,
      custom: {
        ...state.resetSessionVolumes.custom,
        ...config.volumes,
      },
    };
    const next = buildResetSessionLayerState(
      state.layers,
      'custom',
      nextSelections.custom,
      nextVolumes.custom,
    );

    usePlayerStore.setState({
      mode: 'relax',
      resetSessionAudioMode: 'custom',
      resetSessionSelections: nextSelections,
      resetSessionVolumes: nextVolumes,
      layers: next.layers,
    });

    if (Platform.OS !== 'ios') {
      return;
    }

    await this.ensureInitialized();
    await NativeAudioEngine.applyResetCustomConfig(config, next.layerConfigs);
    await this.applyNativeMixState();
    await usePlayerStore.getState().updateAdaptiveParameters();
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
      await NativeAudioEngine.setMasterVolume(usePlayerStore.getState().masterVolume, 300);
      return;
    }

    if (phase === 'return') {
      await NativeAudioEngine.setMasterVolume(1, 900);
      const fadeDelayMs = Math.max(
        0,
        (RESET_RETURN_SECONDS - RESET_RETURN_FADE_OUT_SECONDS) * 1000,
      );
      const fadeMs = RESET_RETURN_FADE_OUT_SECONDS * 1000;

      this.pendingFadeOut = setTimeout(() => {
        this.pendingFadeOut = null;
        void NativeAudioEngine.setMasterVolume(0, fadeMs).catch(() => undefined);
      }, fadeDelayMs);
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

    if (Platform.OS === 'ios') {
      await this.ensureInitialized();
      await NativeAudioEngine.endSession(reason);
    }

    this.lastForegroundScene = 'shell';
    await this.applyScene(this.appState === 'active' ? 'shell' : 'backgrounded');
  }

  async setMuted(muted: boolean): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    await this.ensureInitialized();
    await NativeAudioEngine.setMuted(muted);
  }

  async setMasterVolume(volume: number): Promise<void> {
    usePlayerStore.setState({ masterVolume: volume });

    if (Platform.OS !== 'ios') {
      return;
    }

    await this.ensureInitialized();
    await NativeAudioEngine.setMasterVolume(volume, 100);
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

    if (useAudioSettingsStore.getState().isMuted) {
      return;
    }

    await this.ensureInitialized();
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
    return NativeAudioEngine.getDebugState();
  }
}

export const audioCoordinator = new AudioCoordinator();
