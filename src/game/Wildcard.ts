import { CONFIG } from '../config';
import type { TileColor } from '../types';

const MAIN_SECONDARIES: TileColor[] = ['green', 'purple', 'orange'];

export function randomMainSecondary(): TileColor {
  return MAIN_SECONDARIES[Math.floor(Math.random() * MAIN_SECONDARIES.length)];
}

/** One random goal secondary — all 9 wildcard reward tiles use green, purple, or orange. */
export function pickWildcardRewardColor(): TileColor {
  return randomMainSecondary();
}

export function canSpawnSealedWildcard(onBoardCount: number): boolean {
  return onBoardCount < CONFIG.WILDCARD_MAX_PER_GAME;
}

export function shouldSpawnWildcard(onBoardCount: number): boolean {
  if (!canSpawnSealedWildcard(onBoardCount)) return false;
  return Math.random() < CONFIG.WILDCARD_SPAWN_RATE;
}
