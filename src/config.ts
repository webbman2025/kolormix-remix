export const CONFIG = {
  GRID_COLS: 6,
  GRID_ROWS: 8,
  TILE_SIZE: 50,
  TILE_GAP: 2,
  TIMER_DEFAULT_MS: 120_000,
  TIMER_BONUS_MS: 15_000,
  TIMER_MAX_MS: 180_000,
  TIMER_WARNING_MS: 30_000,
  TIMER_CRITICAL_MS: 10_000,
  COMBO_THRESHOLD: 3,
  COMBO_IDLE_MS: 2_000,
  SECONDARY_CLEAR_MIN: 3,
  SHAKE_MAX_USES: 3,
  WILDCARD_SPAWN_RATE: 0.05,
  WILDCARD_MAX_ON_BOARD: 2,
  SCORE_MERGE: 10,
  SCORE_COMBO_BONUS: 50,
  SCORE_TIME_MULTIPLIER: 2,
  SWIPE_THRESHOLD_PX: 24,
  DOUBLE_TAP_MS: 350,
  SCORE_CLEAR_BONUS: 30,
  GAME_WIDTH: 390,
  GAME_HEIGHT: 844,
  // Layout (matches reference UI)
  HEADER_Y: 22,
  PREVIEW_Y: 68,
  GRID_TOP: 132,
  TIMER_X: 10,
  GRID_LEFT: 32,
  TIMER_BAR_WIDTH: 16,
} as const;

export type GameMode = 'classic' | 'timed' | 'trial';

/** Main secondary objectives — mix each this many times to win. */
export const COLOR_GOALS = {
  green: 25,
  purple: 25,
  orange: 25,
} as const;

export type MainSecondaryGoal = keyof typeof COLOR_GOALS;
