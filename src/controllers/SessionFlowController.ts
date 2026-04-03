import { useSessionStore } from '../stores/sessionStore';
import { getNativeAudioBridge } from '../services/audio/nativeAudioBridge';
import NativeAudioEngine from '../services/audio/nativeAudioModule';
import { pauseBackgroundMusic } from '../services/audio/backgroundMusic';
import { logger } from '../lib/logger';
import type { SessionPhase } from '../stores/sessionStore';

const FADE_DURATION = 15;
const RETURN_DURATION = 25;

interface SessionFlowTimingOverrides {
  fadeSeconds?: number;
  stillSeconds?: number;
  returnSeconds?: number;
}

export class SessionFlowController {
  private startTime = 0;
  private durationMinutes: number;
  private fadeDuration: number;
  private stillDuration: number;
  private returnDuration: number;
  private totalSeconds: number;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private disposed = false;
  private audioEngine = getNativeAudioBridge();

  constructor(durationMinutes: number, timings?: SessionFlowTimingOverrides) {
    this.fadeDuration = timings?.fadeSeconds ?? FADE_DURATION;
    this.stillDuration = timings?.stillSeconds ?? durationMinutes * 60;
    this.returnDuration = timings?.returnSeconds ?? RETURN_DURATION;
    this.durationMinutes = this.stillDuration / 60;
    this.totalSeconds = this.fadeDuration + this.stillDuration + this.returnDuration;
  }

  async start(): Promise<void> {
    this.startTime = Date.now();
    const store = useSessionStore.getState();
    store.setDuration(this.durationMinutes);
    store.startSession({
      mode: 'reset',
      phase: 'fade',
      durationMinutes: this.durationMinutes,
      targetSeconds: this.totalSeconds,
    });

    // Start audio
    try {
      pauseBackgroundMusic();
      await this.audioEngine.play();
      // Initial fade: ramp master volume down
      await NativeAudioEngine.setMasterVolume(
        0.05,
        Math.max(250, Math.min(2000, Math.round(this.fadeDuration * 1000))),
      );
    } catch (error) {
      logger.error('SessionFlowController: failed to start audio', error);
    }

    // Voice prompt placeholder at 5s into fade
    if (this.fadeDuration >= 5) {
      setTimeout(() => {
        if (!this.disposed) {
          logger.info('Voice prompt placeholder: fade phase 5s mark');
        }
      }, 5000);
    }

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
    if (elapsed < this.fadeDuration) return 'fade';
    if (elapsed < this.fadeDuration + this.stillDuration) return 'still';
    if (elapsed < this.totalSeconds) return 'return';
    return 'complete';
  }

  private fadeAudioRamped = false;

  private handleFadePhaseAudio(elapsed: number): void {
    // Ramp volume back up during last 5s of fade
    const rampWindowSeconds = Math.min(5, this.fadeDuration);
    if (!this.fadeAudioRamped && elapsed >= this.fadeDuration - rampWindowSeconds) {
      this.fadeAudioRamped = true;
      NativeAudioEngine.setMasterVolume(
        0.7,
        Math.max(250, Math.round(rampWindowSeconds * 1000)),
      ).catch(() => {});
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
          await NativeAudioEngine.setMasterVolume(
            1.0,
            Math.max(250, Math.min(3000, Math.round(this.returnDuration * 1000))),
          );

          // Voice prompt at 5s into return
          if (this.returnDuration >= 5) {
            setTimeout(() => {
              if (!this.disposed) {
                logger.info('Voice prompt placeholder: return phase 5s mark');
              }
            }, 5000);
          }

          // Fade to silence over last 8s
          const fadeOutWindowSeconds = Math.min(8, this.returnDuration);
          const fadeOutDelay = Math.max(0, this.returnDuration - fadeOutWindowSeconds) * 1000;
          setTimeout(() => {
            if (!this.disposed) {
              NativeAudioEngine.setMasterVolume(
                0.0,
                Math.max(250, Math.round(fadeOutWindowSeconds * 1000)),
              ).catch(() => {});
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
    const stillStart = this.fadeDuration;
    const stillEnd = this.fadeDuration + this.stillDuration;
    return Math.max(0, Math.min(elapsed - stillStart, stillEnd - stillStart));
  }

  getStillRemaining(): number {
    const stillTotal = this.stillDuration;
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
