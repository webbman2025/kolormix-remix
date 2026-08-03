import { COLOR_GOALS, type MainSecondaryGoal } from '../config';
import type { TileColor } from '../types';

const MAIN_SECONDARIES: MainSecondaryGoal[] = ['green', 'purple', 'orange'];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class SecondaryGoalQueue {
  private queue: MainSecondaryGoal[] = [];
  private remaining: Record<MainSecondaryGoal, number> = {
    green: COLOR_GOALS.green,
    purple: COLOR_GOALS.purple,
    orange: COLOR_GOALS.orange,
  };

  constructor() {
    this.reset();
  }

  private buildQueue(): MainSecondaryGoal[] {
    const items: MainSecondaryGoal[] = [];
    for (const color of MAIN_SECONDARIES) {
      for (let i = 0; i < COLOR_GOALS[color]; i++) {
        items.push(color);
      }
    }
    return shuffle(items);
  }

  peek(count: number): TileColor[] {
    return this.queue.slice(0, count);
  }

  currentGoal(): TileColor | null {
    return this.queue[0] ?? null;
  }

  getRemaining(color: MainSecondaryGoal): number {
    return this.remaining[color];
  }

  isComplete(): boolean {
    return this.queue.length === 0;
  }

  /** Advance queue when player creates the current secondary target. */
  tryComplete(result: TileColor): boolean {
    const current = this.queue[0];
    if (!current || result !== current) return false;
    this.queue.shift();
    this.remaining[current] = Math.max(0, this.remaining[current] - 1);
    return true;
  }

  reset(): void {
    this.queue = this.buildQueue();
    this.remaining = {
      green: COLOR_GOALS.green,
      purple: COLOR_GOALS.purple,
      orange: COLOR_GOALS.orange,
    };
  }
}
