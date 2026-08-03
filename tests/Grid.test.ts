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
    grid.cells = Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => null));
    grid.cells[1][1] = 'purple';
    grid.cells[1][4] = 'green';
    grid.cells[5][0] = 'orange';
    grid.cells[5][1] = 'orange';
    grid.cells[5][2] = 'orange';

    expect(grid.getSameSecondaryCluster(1, 1)).toHaveLength(1);
    expect(grid.getSameSecondaryCluster(4, 1)).toHaveLength(1);
    expect(grid.getSameSecondaryCluster(1, 5)).toHaveLength(3);

    const cluster = grid.getSameSecondaryCluster(1, 5);
    expect(cluster).toHaveLength(3);

    grid.clearSecondaryCluster(cluster);
    expect(grid.getCell(1, 1)).toBe('purple');
    expect(grid.getCell(1, 5)).toBeNull();
    expect(grid.getCell(2, 5)).toBeNull();
    expect(grid.getCell(3, 5)).toBeNull();
  });

  it('clears a 2x2 cluster of four without refilling', () => {
    const grid = new Grid();
    grid.cells = Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => null));
    grid.cells[2][1] = 'green';
    grid.cells[2][2] = 'green';
    grid.cells[3][1] = 'green';
    grid.cells[3][2] = 'green';

    const cluster = grid.getSameSecondaryCluster(1, 2);
    expect(cluster).toHaveLength(4);

    grid.clearSecondaryCluster(cluster);
    expect(grid.getCell(1, 2)).toBeNull();
    expect(grid.getCell(2, 2)).toBeNull();
    expect(grid.getCell(1, 3)).toBeNull();
    expect(grid.getCell(2, 3)).toBeNull();
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
