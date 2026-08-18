import { describe, it, expect } from 'vitest';
import { CONFIG } from '../src/config';
import { canSpawnSealedWildcard, shouldSpawnWildcard } from '../src/game/Wildcard';

describe('canSpawnSealedWildcard', () => {
  it('allows a new wildcard while fewer than five are on the board', () => {
    expect(canSpawnSealedWildcard(0)).toBe(true);
    expect(canSpawnSealedWildcard(4)).toBe(true);
  });

  it('blocks a new wildcard when five are already on the board', () => {
    expect(canSpawnSealedWildcard(5)).toBe(false);
    expect(canSpawnSealedWildcard(6)).toBe(false);
  });
});

describe('shouldSpawnWildcard', () => {
  it('never rolls when the board already has five sealed wildcards', () => {
    expect(shouldSpawnWildcard(5)).toBe(false);
  });
});
