import { useSessionStore } from '../stores/sessionStore';
import { getNativeAudioBridge } from '../services/audio/nativeAudioBridge';
import NativeAudioEngine from '../services/audio/nativeAudioModule';
import { logger } from '../lib/logger';
import type { SessionPhase } from '../stores/sessionStore';

const FADE_DURATION = 15;
const RETURN_DURATION = 25;

export class SessionFlowController {
  private startTime = 0;
  private durationMinutes: number;
  private totalSeconds: number;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private disposed = false;
  private audioEngine = getNativeAudioBridge();

  constructor(durationMinutes: number) {
    this.durationMinutes = durationMinutes;
    this.totalSeconds = FADE_DURATION + durationMinutes * 60 + RETURN_DURATION;
  }

  async start(): Promise<void> {
    this.startTime = Date.now();
    const store = useSessionStore.getState();
    store.setDuration(this.durationMinutes);
    store.startSession();

    // Start audio
    try {
      await this.audioEngine.play();
      // Initial fade: ramp master volume down
      await NativeAudioEngine.setMasterVolume(0.05, 2000);
    } catch (error) {
      logger.error('SessionFlowController: failed to start audio', error);
    }

    // Voice prompt placeholder at 5s into fade
    setTimeout(() => {
      if (!this.disposed) {
        logger.info('Voice prompt placeholder: fade phase 5s mark');
      }
    }, 5000);

    // Start accurate tick timer
    this.tickTimer = setInterval(() => this.tick(), 250);
  }

  private tick(): void {
    if (this.disposed) return;

    const elapsed = (Date.now() - this.startTime) / 1000;
    const store = useSessionStore.getState();
    store.tick(elapsed);

    const phase = this.computePhase(elapsed);
    if (phase !== store.phase) {
      store.advancePhase(phase);
      this.onPhaseTransition(phase, elapsed);
    }

    // Handle phase-specific audio ramps within fade phase
    if (phase === 'fade') {
      this.handleFadePhaseAudio(elapsed);
    }

    if (elapsed >= this.totalSeconds) {
      this.complete();
    }
  }

  private computePhase(elapsed: number): SessionPhase {
    if (elapsed < FADE_DURATION) return 'fade';
    if (elapsed < FADE_DURATION + this.durationMinutes * 60) return 'still';
    if (elapsed < this.totalSeconds) return 'return';
    return 'complete';
  }

  private fadeAudioRamped = false;

  private handleFadePhaseAudio(elapsed: number): void {
    // Ramp volume back up during last 5s of fade
    if (!this.fadeAudioRamped && elapsed >= FADE_DURATION - 5) {
      this.fadeAudioRamped = true;
      NativeAudioEngine.setMasterVolume(0.7, 5000).catch(() => {});
    }
  }

  private async onPhaseTransition(phase: SessionPhase, _elapsed: number): Promise<void> {
    logger.info(`Session phase transition: ${phase}`);

    try {
      switch (phase) {
        case 'still':
          // Full adaptive parameters, pad control active
          break;

        case 'return': {
          // Swell master volume
          await NativeAudioEngine.setMasterVolume(1.0, 3000);

          // Voice prompt at 5s into return
          setTimeout(() => {
            if (!this.disposed) {
              logger.info('Voice prompt placeholder: return phase 5s mark');
            }
          }, 5000);

          // Fade to silence over last 8s
          const returnStart = FADE_DURATION + this.durationMinutes * 60;
          const fadeOutDelay = (RETURN_DURATION - 8) * 1000;
          setTimeout(() => {
            if (!this.disposed) {
              NativeAudioEngine.setMasterVolume(0.0, 8000).catch(() => {});
            }
          }, fadeOutDelay);
          break;
        }
      }
    } catch (error) {
      logger.error('SessionFlowController: phase transition error', error);
    }
  }

  private complete(): void {
    if (this.disposed) return;
    useSessionStore.getState().completeSession();
    this.dispose();
  }

  getElapsed(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  getStillElapsed(): number {
    const elapsed = this.getElapsed();
    const stillStart = FADE_DURATION;
    const stillEnd = FADE_DURATION + this.durationMinutes * 60;
    return Math.max(0, Math.min(elapsed - stillStart, stillEnd - stillStart));
  }

  getStillRemaining(): number {
    const stillTotal = this.durationMinutes * 60;
    return Math.max(0, stillTotal - this.getStillElapsed());
  }

  dispose(): void {
    this.disposed = true;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    try {
      this.audioEngine.stop();
    } catch {
      // ignore
    }
  }
}
