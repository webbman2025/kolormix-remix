import { CONFIG } from '../config';

export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export function getSwipeDirection(dx: number, dy: number): SwipeDirection | null {
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < CONFIG.SWIPE_THRESHOLD_PX) return null;
  return Math.abs(dx) > Math.abs(dy)
    ? dx > 0 ? 'right' : 'left'
    : dy > 0 ? 'down' : 'up';
}

export function getNeighbor(
  col: number,
  row: number,
  direction: SwipeDirection,
): { col: number; row: number } {
  switch (direction) {
    case 'up': return { col, row: row - 1 };
    case 'down': return { col, row: row + 1 };
    case 'left': return { col: col - 1, row };
    case 'right': return { col: col + 1, row };
  }
}
