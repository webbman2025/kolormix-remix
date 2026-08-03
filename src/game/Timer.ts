import { CONFIG } from '../config';

export interface TimerCallbacks {
  onWarning30?: () => void;
  onCritical10?: () => void;
  onBonusAwarded?: (addedMs: number) => void;
  onExpire?: () => void;
  onTick?: (remainingMs: number) => void;
}

export class Timer {
  remainingMs: number;
  private running = false;
  private lastTick = 0;
  private warned30 = false;
  private warned10 = false;
  private callbacks: TimerCallbacks;

  constructor(callbacks: TimerCallbacks = {}, initialMs = CONFIG.TIMER_DEFAULT_MS) {
    this.remainingMs = initialMs;
    this.callbacks = callbacks;
  }

  start(): void {
    this.running = true;
    this.lastTick = performance.now();
  }

  pause(): void {
    this.running = false;
  }

  resume(): void {
    if (this.remainingMs > 0) {
      this.running = true;
      this.lastTick = performance.now();
    }
  }

  isRunning(): boolean {
    return this.running;
  }

  tick(now: number): void {
    if (!this.running || this.remainingMs <= 0) return;

    const delta = now - this.lastTick;
    this.lastTick = now;
    this.remainingMs = Math.max(0, this.remainingMs - delta);

    this.callbacks.onTick?.(this.remainingMs);

    if (!this.warned30 && this.remainingMs <= CONFIG.TIMER_WARNING_MS) {
      this.warned30 = true;
      this.callbacks.onWarning30?.();
    }

    if (!this.warned10 && this.remainingMs <= CONFIG.TIMER_CRITICAL_MS) {
      this.warned10 = true;
      this.callbacks.onCritical10?.();
    }

    if (this.remainingMs <= 0) {
      this.running = false;
      this.callbacks.onExpire?.();
    }
  }

  addBonus(ms = CONFIG.TIMER_BONUS_MS): void {
    this.remainingMs = Math.min(CONFIG.TIMER_MAX_MS, this.remainingMs + ms);
    this.callbacks.onBonusAwarded?.(ms);

    if (this.remainingMs > CONFIG.TIMER_WARNING_MS) this.warned30 = false;
    if (this.remainingMs > CONFIG.TIMER_CRITICAL_MS) this.warned10 = false;
  }

  getRemainingSeconds(): number {
    return Math.ceil(this.remainingMs / 1000);
  }

  getProgress(): number {
    return this.remainingMs / CONFIG.TIMER_DEFAULT_MS;
  }

  reset(ms = CONFIG.TIMER_DEFAULT_MS): void {
    this.remainingMs = ms;
    this.warned30 = false;
    this.warned10 = false;
    this.running = false;
    this.lastTick = performance.now();
  }
}
