/** Per-round highlights shown on the game-over screen. */
export class RunStats {
  /** Most wildcard burst waves from a single ★ tap (includes the first wave). */
  bestWildcardChainWaves = 0;
  /** Sealed ★ wildcards earned from 5+ tile clears. */
  wildcardsCreated = 0;
  /** Largest single clear (one double-tap) that earned a sealed ★. */
  bestClearForWildcard = 0;

  recordWildcardChain(waveCount: number): void {
    if (waveCount > this.bestWildcardChainWaves) {
      this.bestWildcardChainWaves = waveCount;
    }
  }

  recordWildcardCreated(): void {
    this.wildcardsCreated++;
  }

  recordClearForWildcard(tileCount: number): void {
    if (tileCount > this.bestClearForWildcard) {
      this.bestClearForWildcard = tileCount;
    }
  }

  reset(): void {
    this.bestWildcardChainWaves = 0;
    this.wildcardsCreated = 0;
    this.bestClearForWildcard = 0;
  }
}
