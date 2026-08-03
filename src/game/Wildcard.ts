import { CONFIG } from '../config';
import type { TileColor } from '../types';

export function shouldSpawnWildcard(currentWildcardCount: number): boolean {
  if (currentWildcardCount >= CONFIG.WILDCARD_MAX_ON_BOARD) return false;
  return Math.random() < CONFIG.WILDCARD_SPAWN_RATE;
}

export function countWildcards(board: (TileColor | null)[][]): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === 'wildcard') count++;
    }
  }
  return count;
}
