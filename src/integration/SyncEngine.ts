export class SyncEngine {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  start(onTick: () => void, intervalMs: number = 16): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(onTick, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
