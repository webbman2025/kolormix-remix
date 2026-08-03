import { CONFIG } from '../config';
import { canMerge, isSecondary, merge, SPAWN_COLORS } from './ColorMixer';
import type { Position, TileColor } from '../types';

export class Grid {
  readonly cols = CONFIG.GRID_COLS;
  readonly rows = CONFIG.GRID_ROWS;
  cells: (TileColor | null)[][];
  private spawnQueue: TileColor[] = [];

  constructor() {
    this.cells = this.createEmpty();
    this.refillQueue(20);
    this.fillAll();
  }

  private createEmpty(): (TileColor | null)[][] {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null),
    );
  }

  getCell(col: number, row: number): TileColor | null {
    if (!this.inBounds(col, row)) return null;
    return this.cells[row][col];
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
      this.spawnQueue.push(this.spawnRandomTile());
    }
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
    return SPAWN_COLORS[Math.floor(Math.random() * SPAWN_COLORS.length)];
  }

  fillAll(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.cells[row][col] === null) {
          this.cells[row][col] = this.takeFromQueue();
        }
      }
    }
  }

  fillEmpty(): void {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.cells[row][col] === null) {
          this.cells[row][col] = this.takeFromQueue();
        }
      }
    }
  }

  clearAndRefill(): void {
    this.cells = this.createEmpty();
    this.refillQueue(20);
    this.fillAll();
  }

  removeTile(col: number, row: number): void {
    if (!this.inBounds(col, row)) return;
    this.cells[row][col] = null;
    this.fillEmpty();
  }

  /** Connected tiles of the same secondary color (8-direction). */
  getSameSecondaryCluster(col: number, row: number): Position[] {
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

      const color = this.getCell(pos.col, pos.row);
      if (color !== targetColor) continue;

      visited.add(key);
      cluster.push(pos);

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dc === 0 && dr === 0) continue;
          const next = { col: pos.col + dc, row: pos.row + dr };
          if (!this.inBounds(next.col, next.row)) continue;
          const nextKey = `${next.col},${next.row}`;
          if (!visited.has(nextKey)) queue.push(next);
        }
      }
    }

    return cluster;
  }

  removeTiles(positions: Position[], refill = true): void {
    for (const { col, row } of positions) {
      if (this.inBounds(col, row)) this.cells[row][col] = null;
    }
    if (refill) this.fillEmpty();
  }

  /** Remove a connected same-color secondary cluster without spawning replacements. */
  clearSecondaryCluster(positions: Position[]): void {
    this.removeTiles(positions, false);
  }

  attemptMerge(from: Position, to: Position): TileColor | null {
    if (!this.inBounds(from.col, from.row) || !this.inBounds(to.col, to.row)) return null;
    if (!this.isAdjacent(from, to)) return null;

    const colorA = this.cells[from.row][from.col];
    const colorB = this.cells[to.row][to.col];
    if (!colorA || !colorB) return null;
    if (!canMerge(colorA, colorB)) return null;

    const result = merge(colorA, colorB);
    if (!result) return null;

    // Both tiles become the secondary result.
    this.cells[to.row][to.col] = result;
    this.cells[from.row][from.col] = result;
    return result;
  }

  hasValidMerge(): boolean {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
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
          const other = this.getCell(n.col, n.row);
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
    const color = this.getCell(col, row);
    if (!color) return `Row ${row + 1}, Column ${col + 1}, empty`;
    return `Row ${row + 1}, Column ${col + 1}, ${color}`;
  }
}
