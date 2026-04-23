import { useSessionStore } from '../stores/sessionStore';
import { audioCoordinator } from '../services/audio/audioCoordinator';
import { logger } from '../lib/logger';
import {
  decrementPerfCounter,
  incrementPerfCounter,
  perfMark,
} from '../lib/perfDiagnostics';
import type { SessionPhase } from '../stores/sessionStore';

const FADE_DURATION = 5;
const RETURN_DURATION = 0;

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
    await audioCoordinator.setSessionPhase('fade');

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
    incrementPerfCounter('activeIntervals');
    perfMark('interval:session-flow:start', { intervalMs: 250 });
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

    if (elapsed >= this.totalSeconds) {
      this.complete();
    }
  }

  private computePhase(elapsed: number): SessionPhase {
    if (elapsed < this.fadeDuration) return 'fade';
    const stillEnd = this.fadeDuration + this.stillDuration;
    if (elapsed < stillEnd) return 'still';
    if (this.returnDuration > 0 && elapsed < this.totalSeconds) return 'return';
    return 'complete';
  }

  private async onPhaseTransition(phase: SessionPhase, _elapsed: number): Promise<void> {
    logger.info(`Session phase transition: ${phase}`);

    try {
      switch (phase) {
        case 'still':
          await audioCoordinator.setSessionPhase('still');
          break;

        case 'return':
          if (this.returnDuration > 0) {
            await audioCoordinator.setSessionPhase('return');
          }
          break;
      }
    } catch (error) {
      logger.error('SessionFlowController: phase transition error', error);
    }
  }

  private complete(): void {
    if (this.disposed) return;
    useSessionStore.getState().completeSession();
    this.dispose('completed');
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

  dispose(reason: 'completed' | 'abandoned' | 'interrupted' = 'abandoned'): void {
    this.disposed = true;
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
      decrementPerfCounter('activeIntervals');
      perfMark('interval:session-flow:stop');
    }
    void audioCoordinator.endSession(reason).catch(() => undefined);
  }
}
