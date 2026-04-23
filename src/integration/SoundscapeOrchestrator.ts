import { getNativeAudioBridge } from '../services/audio/nativeAudioBridge';
import { AdaptiveController, type AdaptiveUpdate } from './AdaptiveController';
import type { AdaptiveParameters, AudioLayer, SoundscapeMode } from '../types';

export interface SoundscapeOrchestratorOptions {
  adaptiveIntervalMs?: number;
  baseBinauralFrequency?: number;
}

export class SoundscapeOrchestrator {
  private readonly audioEngine = getNativeAudioBridge();
  private readonly adaptiveController: AdaptiveController;
  private adaptiveIntervalMs: number;

  constructor(options: SoundscapeOrchestratorOptions = {}) {
    this.adaptiveIntervalMs = options.adaptiveIntervalMs ?? 30_000;
    this.adaptiveController = new AdaptiveController({
      baseBinauralFrequency: options.baseBinauralFrequency,
    });
  }

  async initialize(): Promise<void> {
    await this.audioEngine.initialize();
  }

  async loadMode(mode: SoundscapeMode, parameters: AdaptiveParameters): Promise<void> {
    await this.audioEngine.loadMode(mode, parameters);
  }

  async play(): Promise<void> {
    await this.audioEngine.play();
  }

  pause(): void {
    this.audioEngine.pause();
  }

  stop(): void {
    this.audioEngine.stop();
  }

  setLayerVolume(layer: AudioLayer, volume: number, fadeTime: number = 0.1): void {
    this.audioEngine.setLayerVolume(layer, volume, fadeTime);
  }

  setMasterVolume(volume: number, fadeTime: number = 0.1): void {
    this.audioEngine.setMasterVolume(volume, fadeTime);
  }

  setLayerMuted(layer: AudioLayer, muted: boolean): void {
    this.audioEngine.setLayerMuted(layer, muted);
  }

  async updateAdaptiveParameters(parameters: AdaptiveParameters): Promise<void> {
    await this.audioEngine.updateAdaptiveParameters(parameters);
  }

  startAdaptiveUpdates(onUpdate: (update: AdaptiveUpdate) => void): void {
    this.adaptiveController.start(this.adaptiveIntervalMs, onUpdate);
  }

  stopAdaptiveUpdates(): void {
    this.adaptiveController.stop();
  }

  async dispose(): Promise<void> {
    await this.audioEngine.dispose();
    this.stopAdaptiveUpdates();
  }
}
