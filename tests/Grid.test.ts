import { describe, it, expect } from 'vitest';
import { Grid } from '../src/game/Grid';
import { Shake } from '../src/game/Shake';
import { CONFIG } from '../src/config';

describe('Grid', () => {
  it('has correct dimensions', () => {
    const grid = new Grid();
    expect(grid.cols).toBe(CONFIG.GRID_COLS);
    expect(grid.rows).toBe(CONFIG.GRID_ROWS);
  });

  it('detects orthogonal and diagonal adjacency', () => {
    const grid = new Grid();
    expect(grid.isAdjacent({ col: 0, row: 0 }, { col: 1, row: 0 })).toBe(true);
    expect(grid.isAdjacent({ col: 0, row: 0 }, { col: 1, row: 1 })).toBe(true);
    expect(grid.isAdjacent({ col: 0, row: 0 }, { col: 2, row: 0 })).toBe(false);
    expect(grid.isAdjacent({ col: 0, row: 0 }, { col: 2, row: 2 })).toBe(false);
  });

  it('fills all cells on init with starter primaries only', () => {
    const grid = new Grid();
    expect(grid.isFull()).toBe(true);
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const color = grid.getCell(col, row);
        expect(['red', 'blue', 'yellow']).toContain(color);
      }
    }
  });

  it('merge turns both primaries into secondary', () => {
    const grid = new Grid();
    grid.cells = Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => null));
    grid.cells[0][0] = 'red';
    grid.cells[0][1] = 'blue';

    const result = grid.attemptMerge({ col: 0, row: 0 }, { col: 1, row: 0 });
    expect(result).toBe('purple');
    expect(grid.getCell(0, 0)).toBe('purple');
    expect(grid.getCell(1, 0)).toBe('purple');
  });

  it('finds same-color secondary clusters for double-tap clear', () => {
    const grid = new Grid();
    grid.cells = Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => 'red'));
    grid.cells[1][1] = 'purple';
    grid.cells[4][1] = 'green';
    grid.cells[5][0] = 'orange';
    grid.cells[5][1] = 'orange';
    grid.cells[5][2] = 'orange';

    expect(grid.getSameSecondaryCluster(1, 1)).toHaveLength(1);
    expect(grid.getSameSecondaryCluster(1, 4)).toHaveLength(1);
    expect(grid.getSameSecondaryCluster(1, 5)).toHaveLength(3);

    const cluster = grid.getSameSecondaryCluster(1, 5);
    expect(cluster).toHaveLength(3);

    grid.clearSecondaryCluster(cluster);
    const col1 = Array.from({ length: 8 }, (_, row) => grid.getCell(1, row));
    expect(col1).toContain('purple');
    expect(col1).toContain('green');
    expect(col1).not.toContain('orange');
    expect(grid.getCell(0, 5)).toMatch(/^(red|blue|yellow)$/);
    expect(grid.getCell(2, 5)).toMatch(/^(red|blue|yellow)$/);
  });

  it('does not bridge two pairs through diagonal-only contact', () => {
    const grid = new Grid();
    grid.cells = Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => 'red'));
    grid.cells[0][0] = 'green';
    grid.cells[0][1] = 'green';
    grid.cells[2][1] = 'green';
    grid.cells[2][2] = 'green';

    expect(grid.getSameSecondaryCluster(0, 0)).toHaveLength(2);
    expect(grid.getSameSecondaryCluster(1, 2)).toHaveLength(2);
  });

  it('includes a solid 2x2 block as one cluster of four', () => {
    const grid = new Grid();
    grid.cells = Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => 'red'));
    grid.cells[2][1] = 'green';
    grid.cells[2][2] = 'green';
    grid.cells[3][1] = 'green';
    grid.cells[3][2] = 'green';

    expect(grid.getSameSecondaryCluster(1, 2)).toHaveLength(4);
  });

  it('clears a 2x2 cluster of four and refills with primaries', () => {
    const grid = new Grid();
    grid.cells = Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => 'red'));
    grid.cells[2][1] = 'green';
    grid.cells[2][2] = 'green';
    grid.cells[3][1] = 'green';
    grid.cells[3][2] = 'green';

    const cluster = grid.getSameSecondaryCluster(1, 2);
    expect(cluster).toHaveLength(4);

    const { spawns } = grid.clearSecondaryCluster(cluster);
    expect(spawns).toHaveLength(4);
    for (let row = 0; row < 8; row++) {
      expect(grid.getCell(1, row)).not.toBeNull();
      expect(grid.getCell(2, row)).not.toBeNull();
    }
    expect(grid.getCell(1, 2)).not.toBe('green');
    expect(grid.getCell(2, 3)).not.toBe('green');
  });

  it('shifts top tiles down when clearing a gap below them in the same column', () => {
    const grid = new Grid();
    grid.cells = Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => 'red'));
    grid.cells[2][1] = 'green';
    grid.cells[3][1] = 'green';

    const { moves, spawns } = grid.clearClusterWithGravity([
      { col: 1, row: 2 },
      { col: 1, row: 3 },
    ]);

    expect(spawns).toHaveLength(2);
    expect(moves).toEqual(
      expect.arrayContaining([
        { col: 1, fromRow: 0, toRow: 2 },
        { col: 1, fromRow: 1, toRow: 3 },
      ]),
    );
    expect(spawns.some((s) => s.col === 1 && s.row === 0)).toBe(true);
    expect(spawns.some((s) => s.col === 1 && s.row === 1)).toBe(true);
    expect(grid.getCell(1, 2)).toBe('red');
    expect(grid.getCell(1, 3)).toBe('red');
  });

  it('applies column gravity with spawns at top and tiles falling down', () => {
    const grid = new Grid();
    grid.cells = Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => 'red'));
    grid.cells[0][0] = 'blue';
    grid.cells[1][0] = 'yellow';
    grid.cells[2][0] = 'green';
    grid.cells[3][0] = 'green';
    grid.cells[4][0] = 'green';

    const cluster = grid.getSameSecondaryCluster(0, 2);
    expect(cluster).toHaveLength(3);

    const { moves, spawns } = grid.clearClusterWithGravity(cluster);

    expect(spawns).toHaveLength(3);
    expect(spawns.every((s) => s.col === 0)).toBe(true);
    expect(moves.some((m) => m.col === 0 && m.fromRow === 0 && m.toRow === 3)).toBe(true);
    expect(moves.some((m) => m.col === 0 && m.fromRow === 1 && m.toRow === 4)).toBe(true);
    expect(grid.getCell(0, 0)).toMatch(/^(red|blue|yellow)$/);
    expect(grid.getCell(0, 3)).toBe('blue');
    expect(grid.getCell(0, 4)).toBe('yellow');
  });
});

describe('Shake', () => {
  it('limits uses per level', () => {
    const shake = new Shake(3);
    expect(shake.use()).toBe(true);
    expect(shake.use()).toBe(true);
    expect(shake.use()).toBe(true);
    expect(shake.use()).toBe(false);
    expect(shake.usesRemaining).toBe(0);
  });
});
