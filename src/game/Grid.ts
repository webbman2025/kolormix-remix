import { CONFIG } from '../config';
import { canMerge, isPrimary, isSecondary, merge, SPAWN_COLORS } from './ColorMixer';
import { pickWildcardRewardColor, randomMainSecondary } from './Wildcard';
import type { GravityResult, Position, TileColor, TileMove, TileSpawn, WildcardSpawn } from '../types';

interface BoardTileState {
  color: TileColor;
  wildcardBonus: TileColor | null;
  wildcardReward: boolean;
}

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

export class Grid {
  readonly cols = CONFIG.GRID_COLS;
  readonly rows = CONFIG.GRID_ROWS;
  cells: (TileColor | null)[][];
  /** Disguise secondary color when a cell holds a sealed wildcard bonus tile. */
  private wildcardBonus: (TileColor | null)[][];
  /** Tappable wildcard reward tiles (3×3 group after activation). */
  private wildcardReward: boolean[][];
  private spawnQueue: TileColor[] = [];

  constructor() {
    this.cells = this.createEmpty();
    this.wildcardBonus = this.createWildcardEmpty();
    this.wildcardReward = this.createRewardEmpty();
    this.refillQueue(20);
    this.fillAll();
  }

  private createRewardEmpty(): boolean[][] {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => false),
    );
  }

  private createWildcardEmpty(): (TileColor | null)[][] {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null),
    );
  }

  private createEmpty(): (TileColor | null)[][] {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null),
    );
  }

  getCell(col: number, row: number): TileColor | null {
    if (!this.inBounds(col, row)) return null;
    if (this.isWildcardBonus(col, row)) {
      return this.wildcardBonus[row][col];
    }
    return this.cells[row][col];
  }

  getRawCell(col: number, row: number): TileColor | null {
    if (!this.inBounds(col, row)) return null;
    return this.cells[row][col];
  }

  isWildcardBonus(col: number, row: number): boolean {
    if (!this.inBounds(col, row)) return false;
    return this.wildcardBonus[row][col] !== null;
  }

  getWildcardDisguise(col: number, row: number): TileColor | null {
    if (!this.inBounds(col, row)) return null;
    return this.wildcardBonus[row][col];
  }

  setWildcardBonus(col: number, row: number, disguise: TileColor): void {
    if (!this.inBounds(col, row)) return;
    this.cells[row][col] = disguise;
    this.wildcardBonus[row][col] = disguise;
  }

  clearWildcardBonus(col: number, row: number): void {
    if (!this.inBounds(col, row)) return;
    this.wildcardBonus[row][col] = null;
  }

  isWildcardCell(col: number, row: number): boolean {
    return this.isWildcardBonus(col, row) || this.isWildcardReward(col, row);
  }

  isWildcardReward(col: number, row: number): boolean {
    if (!this.inBounds(col, row)) return false;
    return this.wildcardReward[row][col];
  }

  getWildcardRewardGroup(): Position[] {
    const group: Position[] = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.wildcardReward[row][col]) group.push({ col, row });
      }
    }
    return group;
  }

  hasWildcardRewardGroup(): boolean {
    return this.getWildcardRewardGroup().length > 0;
  }

  clearWildcardRewardFlags(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.wildcardReward[row][col] = false;
      }
    }
  }

  countSealedWildcards(): number {
    let count = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.isWildcardBonus(col, row)) count++;
      }
    }
    return count;
  }

  canSpawnSealedWildcard(): boolean {
    return this.countSealedWildcards() < CONFIG.WILDCARD_MAX_PER_GAME;
  }

  /**
   * Tap sealed wildcard — first the tapped ★ bursts, then each chain wave detonates
   * every ★ caught in the previous wave simultaneously (conflicts keep prior wave color).
   */
  activateWildcardBonusChain(anchor: Position, source: Position): WildcardSpawn[][] {
    this.clearWildcardRewardFlags();
    const waves = this.planWildcardBonusChain(anchor, source);
    for (const wave of waves) {
      this.applyWildcardWave(wave);
    }
    return waves;
  }

  /** Compute burst waves without mutating the live grid (for staged animation). */
  planWildcardBonusChain(_anchor: Position, source: Position): WildcardSpawn[][] {
    const cells = this.cells.map((row) => [...row]);
    const wildcardBonus = this.wildcardBonus.map((row) => [...row]);
    const waves: WildcardSpawn[][] = [];

    const nextBatch: Position[] = [];
    waves.push(this.burstWildcardAtOnState(cells, wildcardBonus, source, nextBatch));

    let batch = Grid.dedupePositions(nextBatch);
    while (batch.length > 0) {
      const upcoming: Position[] = [];
      waves.push(
        this.burstSimultaneousBatchOnState(cells, wildcardBonus, batch, upcoming),
      );
      batch = Grid.dedupePositions(upcoming);
    }

    return waves;
  }

  private static dedupePositions(positions: Position[]): Position[] {
    const seen = new Set<string>();
    const result: Position[] = [];
    for (const pos of positions) {
      const key = `${pos.col},${pos.row}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(pos);
    }
    return result;
  }

  private static posKey(pos: Position): string {
    return `${pos.col},${pos.row}`;
  }

  applyWildcardWave(spawns: WildcardSpawn[]): void {
    for (const { col, row, color } of spawns) {
      this.wildcardBonus[row][col] = null;
      this.cells[row][col] = color;
      this.wildcardReward[row][col] = true;
    }
  }

  /** In-bounds cells in a 3×3 around center — fewer on board edges/corners. */
  getGrouped3x3(center: Position): Position[] {
    const positions: Position[] = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const col = center.col + dc;
        const row = center.row + dr;
        if (this.inBounds(col, row)) {
          positions.push({ col, row });
        }
      }
    }

    return positions;
  }

  private burstWildcardAtOnState(
    cells: (TileColor | null)[][],
    wildcardBonus: (TileColor | null)[][],
    source: Position,
    chainQueue: Position[],
  ): WildcardSpawn[] {
    const rewardColor =
      wildcardBonus[source.row][source.col] ?? pickWildcardRewardColor();
    const targets = this.getGrouped3x3(source);
    const spawns: WildcardSpawn[] = [];

    for (const pos of targets) {
      if (
        wildcardBonus[pos.row][pos.col] !== null &&
        (pos.col !== source.col || pos.row !== source.row)
      ) {
        if (!chainQueue.some((p) => p.col === pos.col && p.row === pos.row)) {
          chainQueue.push({ col: pos.col, row: pos.row });
        }
        continue;
      }

      wildcardBonus[pos.row][pos.col] = null;
      cells[pos.row][pos.col] = rewardColor;
      spawns.push({ col: pos.col, row: pos.row, color: rewardColor });
    }

    return spawns;
  }

  /** Every ★ in the batch bursts at once; cells claimed by 2+ bursts keep the prior wave color. */
  private burstSimultaneousBatchOnState(
    cells: (TileColor | null)[][],
    wildcardBonus: (TileColor | null)[][],
    batch: Position[],
    nextBatch: Position[],
  ): WildcardSpawn[] {
    const batchKeys = new Set(batch.map((p) => Grid.posKey(p)));
    const claims = new Map<string, TileColor[]>();
    const forced = new Map<string, TileColor>();

    const queueNext = (pos: Position): void => {
      if (!nextBatch.some((p) => p.col === pos.col && p.row === pos.row)) {
        nextBatch.push({ col: pos.col, row: pos.row });
      }
    };

    const addClaim = (pos: Position, color: TileColor): void => {
      const key = Grid.posKey(pos);
      const list = claims.get(key) ?? [];
      list.push(color);
      claims.set(key, list);
    };

    for (const source of batch) {
      const color =
        wildcardBonus[source.row][source.col] ?? pickWildcardRewardColor();
      forced.set(Grid.posKey(source), color);

      for (const pos of this.getGrouped3x3(source)) {
        const key = Grid.posKey(pos);
        if (wildcardBonus[pos.row][pos.col] !== null && !batchKeys.has(key)) {
          queueNext(pos);
          continue;
        }
        addClaim(pos, color);
      }
    }

    const spawns: WildcardSpawn[] = [];
    const applied = new Set<string>();

    for (const [key, color] of forced) {
      const [col, row] = key.split(',').map(Number);
      wildcardBonus[row][col] = null;
      cells[row][col] = color;
      spawns.push({ col, row, color });
      applied.add(key);
    }

    for (const [key, colors] of claims) {
      if (applied.has(key)) continue;
      if (colors.length >= 2) continue;

      const [col, row] = key.split(',').map(Number);
      wildcardBonus[row][col] = null;
      cells[row][col] = colors[0];
      spawns.push({ col, row, color: colors[0] });
      applied.add(key);
    }

    for (const source of batch) {
      wildcardBonus[source.row][source.col] = null;
    }

    return spawns;
  }

  /** Place a sealed wildcard at the clear tap position. */
  spawnWildcardBonusAt(col: number, row: number, disguise: TileColor = randomMainSecondary()): boolean {
    if (!this.inBounds(col, row)) return false;
    if (this.isWildcardBonus(col, row)) return true;
    this.setWildcardBonus(col, row, disguise);
    return true;
  }

  inBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
  }

  /** Orthogonal or diagonal neighbor (8-direction). */
  isAdjacent(a: Position, b: Position): boolean {
    const dc = Math.abs(a.col - b.col);
    const dr = Math.abs(a.row - b.row);
    return dc <= 1 && dr <= 1 && (dc > 0 || dr > 0);
  }

  private refillQueue(min = 10): void {
    while (this.spawnQueue.length < min) {
      this.spawnQueue.push(...this.nextSpawnBatch());
    }
  }

  /** One red, one blue, one yellow — shuffled so primaries stay evenly distributed. */
  private nextSpawnBatch(): TileColor[] {
    const batch = [...SPAWN_COLORS];
    shuffleInPlace(batch);
    return batch;
  }

  peekNext(count: number): TileColor[] {
    this.refillQueue(count + 5);
    return this.spawnQueue.slice(0, count);
  }

  private takeFromQueue(): TileColor {
    this.refillQueue();
    return this.spawnQueue.shift()!;
  }

  spawnRandomTile(): TileColor {
    this.refillQueue(1);
    return this.spawnQueue.shift()!;
  }

  /** Randomize tile positions without changing colors, wildcards, or rewards. */
  shuffleTiles(): void {
    const slots: (BoardTileState | null)[] = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const color = this.cells[row][col];
        if (!color) {
          slots.push(null);
          continue;
        }

        slots.push({
          color,
          wildcardBonus: this.wildcardBonus[row][col],
          wildcardReward: this.wildcardReward[row][col],
        });
      }
    }

    shuffleInPlace(slots);

    this.cells = this.createEmpty();
    this.wildcardBonus = this.createWildcardEmpty();
    this.wildcardReward = this.createRewardEmpty();

    let index = 0;
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = slots[index++];
        if (!tile) continue;

        this.cells[row][col] = tile.color;
        this.wildcardBonus[row][col] = tile.wildcardBonus;
        this.wildcardReward[row][col] = tile.wildcardReward;
      }
    }
  }

  fillAll(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.cells[row][col] === null) {
          this.cells[row][col] = this.takeFromQueue();
          this.wildcardBonus[row][col] = null;
          this.wildcardReward[row][col] = false;
        }
      }
    }
  }

  fillEmpty(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.cells[row][col] === null) {
          this.cells[row][col] = this.takeFromQueue();
          this.wildcardBonus[row][col] = null;
          this.wildcardReward[row][col] = false;
        }
      }
    }
  }

  clearAndRefill(): void {
    this.cells = this.createEmpty();
    this.wildcardBonus = this.createWildcardEmpty();
    this.wildcardReward = this.createRewardEmpty();
    this.refillQueue(20);
    this.fillAll();
  }

  removeTile(col: number, row: number): void {
    if (!this.inBounds(col, row)) return;
    this.cells[row][col] = null;
    this.wildcardBonus[row][col] = null;
    this.wildcardReward[row][col] = false;
    this.fillEmpty();
  }

  /** Turn a random primary cell into a wildcard bonus disguised as a secondary. */
  spawnWildcardBonus(preferCols: number[] = []): boolean {
    const preferred: Position[] = [];
    const fallback: Position[] = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const color = this.cells[row][col];
        if (!color || !isPrimary(color) || this.isWildcardCell(col, row)) continue;
        const pos = { col, row };
        if (preferCols.includes(col)) preferred.push(pos);
        else fallback.push(pos);
      }
    }

    const pool = preferred.length > 0 ? preferred : fallback;
    if (pool.length === 0) return false;

    const pick = pool[Math.floor(Math.random() * pool.length)];
    this.setWildcardBonus(pick.col, pick.row, randomMainSecondary());
    return true;
  }

  /** Connected same-color secondaries — includes wildcard reward tiles and chains to neighbors. */
  getSameSecondaryCluster(col: number, row: number): Position[] {
    if (this.isWildcardBonus(col, row)) return [];

    const start = this.getCell(col, row);
    if (!start || !isSecondary(start)) return [];

    const targetColor = start;
    const visited = new Set<string>();
    const cluster: Position[] = [];
    const queue: Position[] = [{ col, row }];

    while (queue.length > 0) {
      const pos = queue.shift()!;
      const key = `${pos.col},${pos.row}`;
      if (visited.has(key)) continue;
      if (this.isWildcardBonus(pos.col, pos.row)) continue;

      const color = this.getCell(pos.col, pos.row);
      if (color !== targetColor) continue;

      visited.add(key);
      cluster.push(pos);

      const neighbors: Position[] = [
        { col: pos.col + 1, row: pos.row },
        { col: pos.col - 1, row: pos.row },
        { col: pos.col, row: pos.row + 1 },
        { col: pos.col, row: pos.row - 1 },
      ];
      for (const next of neighbors) {
        if (!this.inBounds(next.col, next.row)) continue;
        const nextKey = `${next.col},${next.row}`;
        if (!visited.has(nextKey)) queue.push(next);
      }
    }

    return cluster;
  }

  clusterHasWildcardReward(cluster: Position[]): boolean {
    return cluster.some((p) => this.isWildcardReward(p.col, p.row));
  }

  /** Cells that belong to a clearable same-color secondary cluster (computed once per refresh). */
  getClearableClusterKeys(): Set<string> {
    const clearable = new Set<string>();
    const visited = new Set<string>();

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const key = `${col},${row}`;
        if (visited.has(key)) continue;
        if (this.isWildcardBonus(col, row)) continue;

        const color = this.getCell(col, row);
        if (!color || !isSecondary(color)) continue;

        const cluster = this.getSameSecondaryCluster(col, row);
        if (cluster.length < CONFIG.SECONDARY_CLEAR_MIN) continue;

        for (const pos of cluster) {
          const clusterKey = `${pos.col},${pos.row}`;
          visited.add(clusterKey);
          clearable.add(clusterKey);
        }
      }
    }

    return clearable;
  }

  removeTiles(positions: Position[], refill = true): void {
    for (const { col, row } of positions) {
      if (this.inBounds(col, row)) {
        this.cells[row][col] = null;
        this.wildcardBonus[row][col] = null;
        this.wildcardReward[row][col] = false;
      }
    }
    if (refill) this.fillEmpty();
  }

  /** Remove a connected same-color secondary cluster, apply column gravity, spawn primaries at top. */
  clearSecondaryCluster(positions: Position[]): GravityResult {
    return this.clearClusterWithGravity(positions);
  }

  clearClusterWithGravity(positions: Position[]): GravityResult {
    for (const { col, row } of positions) {
      if (this.inBounds(col, row)) {
        this.cells[row][col] = null;
        this.wildcardBonus[row][col] = null;
        this.wildcardReward[row][col] = false;
      }
    }

    const moves: TileMove[] = [];
    const spawns: TileSpawn[] = [];
    const affectedCols = new Set(positions.map((p) => p.col));

    for (const col of affectedCols) {
      const remaining: {
        color: TileColor;
        wildcard: TileColor | null;
        fromRow: number;
      }[] = [];

      for (let row = 0; row < this.rows; row++) {
        const color = this.cells[row][col];
        if (color !== null) {
          remaining.push({
            color,
            wildcard: this.wildcardBonus[row][col],
            fromRow: row,
          });
        }
      }

      const spawnCount = this.rows - remaining.length;
      const columnSpawns: TileSpawn[] = [];

      let destRow = spawnCount;
      for (const tile of remaining) {
        if (tile.fromRow !== destRow) {
          moves.push({ col, fromRow: tile.fromRow, toRow: destRow });
        }
        destRow++;
      }

      for (let row = 0; row < spawnCount; row++) {
        const color = this.takeFromQueue();
        columnSpawns.push({ col, row, color });
        spawns.push({ col, row, color });
      }

      for (let row = 0; row < this.rows; row++) {
        this.cells[row][col] = null;
        this.wildcardBonus[row][col] = null;
        this.wildcardReward[row][col] = false;
      }

      for (let row = 0; row < spawnCount; row++) {
        this.cells[row][col] = columnSpawns[row].color;
      }
      for (let i = 0; i < remaining.length; i++) {
        this.cells[spawnCount + i][col] = remaining[i].color;
        this.wildcardBonus[spawnCount + i][col] = remaining[i].wildcard;
      }
    }

    return { moves, spawns };
  }

  attemptMerge(from: Position, to: Position): TileColor | null {
    if (!this.inBounds(from.col, from.row) || !this.inBounds(to.col, to.row)) return null;
    if (!this.isAdjacent(from, to)) return null;
    if (this.isWildcardCell(from.col, from.row) || this.isWildcardCell(to.col, to.row)) {
      return null;
    }

    const colorA = this.cells[from.row][from.col];
    const colorB = this.cells[to.row][to.col];
    if (!colorA || !colorB) return null;
    if (!canMerge(colorA, colorB)) return null;

    const result = merge(colorA, colorB);
    if (!result) return null;

    this.cells[to.row][to.col] = result;
    this.cells[from.row][from.col] = result;
    this.wildcardBonus[to.row][to.col] = null;
    this.wildcardBonus[from.row][from.col] = null;
    this.wildcardReward[to.row][to.col] = false;
    this.wildcardReward[from.row][from.col] = false;
    return result;
  }

  hasValidMerge(): boolean {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.isWildcardCell(col, row)) continue;
        const color = this.cells[row][col];
        if (!color) continue;
        const neighbors: Position[] = [
          { col: col + 1, row },
          { col: col - 1, row },
          { col, row: row + 1 },
          { col, row: row - 1 },
          { col: col + 1, row: row + 1 },
          { col: col - 1, row: row - 1 },
          { col: col + 1, row: row - 1 },
          { col: col - 1, row: row + 1 },
        ];
        for (const n of neighbors) {
          if (this.isWildcardCell(n.col, n.row)) continue;
          const other = this.getRawCell(n.col, n.row);
          if (other && canMerge(color, other)) return true;
        }
      }
    }
    return false;
  }

  isFull(): boolean {
    return this.cells.every((row) => row.every((c) => c !== null));
  }

  isGameOver(): boolean {
    return this.isFull() && !this.hasValidMerge();
  }

  getAriaLabel(col: number, row: number): string {
    if (this.isWildcardReward(col, row)) {
      const color = this.getCell(col, row);
      return `Row ${row + 1}, Column ${col + 1}, wildcard reward ${color}. Tap to collect.`;
    }
    if (this.isWildcardBonus(col, row)) {
      const disguise = this.getWildcardDisguise(col, row);
      return `Row ${row + 1}, Column ${col + 1}, wildcard bonus disguised as ${disguise}`;
    }
    const color = this.getCell(col, row);
    if (!color) return `Row ${row + 1}, Column ${col + 1}, empty`;
    return `Row ${row + 1}, Column ${col + 1}, ${color}`;
  }
}
