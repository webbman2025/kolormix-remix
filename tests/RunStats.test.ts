import { describe, it, expect } from 'vitest';
import { RunStats } from '../src/game/RunStats';

describe('RunStats', () => {
  it('tracks the best wildcard chain wave count', () => {
    const stats = new RunStats();
    stats.recordWildcardChain(2);
    stats.recordWildcardChain(4);
    stats.recordWildcardChain(3);
    expect(stats.bestWildcardChainWaves).toBe(4);
  });

  it('counts sealed wildcards earned from clears', () => {
    const stats = new RunStats();
    stats.recordWildcardCreated();
    stats.recordWildcardCreated();
    expect(stats.wildcardsCreated).toBe(2);
  });

  it('keeps the largest clear that earned a wildcard', () => {
    const stats = new RunStats();
    stats.recordClearForWildcard(5);
    stats.recordClearForWildcard(8);
    stats.recordClearForWildcard(6);
    expect(stats.bestClearForWildcard).toBe(8);
  });

  it('resets between rounds', () => {
    const stats = new RunStats();
    stats.recordWildcardChain(3);
    stats.recordWildcardCreated();
    stats.recordClearForWildcard(7);
    stats.reset();
    expect(stats.bestWildcardChainWaves).toBe(0);
    expect(stats.wildcardsCreated).toBe(0);
    expect(stats.bestClearForWildcard).toBe(0);
  });
});
