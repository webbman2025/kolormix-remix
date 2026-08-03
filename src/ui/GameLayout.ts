import { CONFIG } from '../config';

/** Layout zones derived from the reference UI (390×844 design). */
const DESIGN = {
  HEADER_HEIGHT: 52,
  PREVIEW_HEIGHT: 100,
  HEADER_Y: 24,
  TIMER_X: 8,
  TIMER_BAR_WIDTH: 18,
  TIMER_GAP: 8,
  EDGE_PAD: 6,
  GRID_BOTTOM_PAD: 4,
  MIN_TILE_SIZE: 32,
} as const;

export interface GameLayout {
  width: number;
  height: number;
  uiScale: number;
  headerHeight: number;
  previewPanelHeight: number;
  headerY: number;
  previewY: number;
  gridTop: number;
  gridLeft: number;
  tileSize: number;
  tileGap: number;
  timerX: number;
  timerBarWidth: number;
  timerColumnWidth: number;
  gridHeight: number;
}

/** Pin header/preview zones; reserve left timer column; shrink tiles when crowded. */
export function computeGameLayout(width: number, height: number): GameLayout {
  const uiScale = width / CONFIG.GAME_WIDTH;

  const headerHeight = Math.round(DESIGN.HEADER_HEIGHT * uiScale);
  const previewPanelHeight = Math.round(DESIGN.PREVIEW_HEIGHT * uiScale);
  const headerY = Math.round(DESIGN.HEADER_Y * uiScale);
  const previewY = headerHeight + Math.round(previewPanelHeight / 2);
  const gridTop = headerHeight + previewPanelHeight;
  const gridBottomPad = Math.max(2, Math.round(DESIGN.GRID_BOTTOM_PAD * uiScale));

  const timerX = Math.round(DESIGN.TIMER_X * uiScale);
  const timerBarWidth = Math.max(14, Math.round(DESIGN.TIMER_BAR_WIDTH * uiScale));
  const timerGap = Math.round(DESIGN.TIMER_GAP * uiScale);
  const timerColumnWidth = timerX + timerBarWidth + timerGap;
  const edgePad = Math.max(4, Math.round(DESIGN.EDGE_PAD * uiScale));

  const gridAreaLeft = timerColumnWidth;
  const gridAreaRight = width - edgePad;
  const availableWidth = Math.max(0, gridAreaRight - gridAreaLeft);
  const availableHeight = Math.max(0, height - gridTop - gridBottomPad);

  const gap = Math.max(2, Math.round(2 * uiScale));
  const tileSizeFromWidth = Math.floor(
    (availableWidth - (CONFIG.GRID_COLS - 1) * gap) / CONFIG.GRID_COLS,
  );
  const tileSizeFromHeight = Math.floor(
    (availableHeight - (CONFIG.GRID_ROWS - 1) * gap) / CONFIG.GRID_ROWS,
  );
  const minTile = Math.max(DESIGN.MIN_TILE_SIZE, Math.round(32 * uiScale));
  const tileSize = Math.max(minTile, Math.min(tileSizeFromWidth, tileSizeFromHeight));
  const tileGap = Math.max(2, Math.round(tileSize * 0.04));

  const gridWidth = CONFIG.GRID_COLS * tileSize + (CONFIG.GRID_COLS - 1) * tileGap;
  const gridLeft = gridAreaLeft + Math.max(0, (availableWidth - gridWidth) / 2);
  const gridHeight = CONFIG.GRID_ROWS * (tileSize + tileGap) - tileGap;

  return {
    width,
    height,
    uiScale,
    headerHeight,
    previewPanelHeight,
    headerY,
    previewY,
    gridTop,
    gridLeft,
    tileSize,
    tileGap,
    timerX,
    timerBarWidth,
    timerColumnWidth,
    gridHeight,
  };
}
