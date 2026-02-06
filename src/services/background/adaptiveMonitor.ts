import { AdaptiveController } from '../../integration/AdaptiveController';
import type { AdaptiveUpdate } from '../../integration/AdaptiveController';

export class AdaptiveMonitor {
  private readonly controller: AdaptiveController;
  private readonly intervalMs: number;

  constructor(intervalMs: number = 30_000) {
    this.intervalMs = intervalMs;
    this.controller = new AdaptiveController();
  }

  start(onUpdate: (update: AdaptiveUpdate) => void): void {
    this.controller.start(this.intervalMs, onUpdate);
  }

  stop(): void {
    this.controller.stop();
  }
}
