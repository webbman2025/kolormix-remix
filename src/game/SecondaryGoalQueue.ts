import { COLOR_GOALS, type MainSecondaryGoal } from '../config';
import type { TileColor } from '../types';

const MAIN_SECONDARIES: MainSecondaryGoal[] = ['green', 'purple', 'orange'];
const MAIN_SECONDARY_SET = new Set<MainSecondaryGoal>(MAIN_SECONDARIES);

export function isMainSecondaryGoal(color: TileColor): color is MainSecondaryGoal {
  return MAIN_SECONDARY_SET.has(color as MainSecondaryGoal);
}

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

  /** True when all clear counters (top-right) have reached zero. */
  isComplete(): boolean {
    return MAIN_SECONDARIES.every((color) => this.remaining[color] === 0);
  }

  /** Advance the mix preview queue when the player creates the current target. */
  tryComplete(result: TileColor): boolean {
    const current = this.queue[0];
    if (!current || result !== current) return false;
    this.queue.shift();
    return true;
  }

  /** Deduct cleared main-secondary tiles from the top-right counters only. */
  recordClear(color: TileColor, count: number): number {
    if (!isMainSecondaryGoal(color) || count <= 0) return 0;

    const deduct = Math.min(count, this.remaining[color]);
    if (deduct <= 0) return 0;

    this.remaining[color] -= deduct;
    return deduct;
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
