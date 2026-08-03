import type { TileColor } from '../types';

/** All primary base colors used in mix rules. */
export const PRIMARY_COLORS: TileColor[] = ['red', 'blue', 'yellow', 'white', 'black'];

/** Primary colors that spawn on the board at game start (others unlock later). */
export const SPAWN_COLORS: TileColor[] = ['red', 'blue', 'yellow'];

/** Result colors from the Kolormix help screen (page 2/3). */
export const SECONDARY_COLORS: TileColor[] = [
  'purple',
  'green',
  'orange',
  'pink',
  'cyan',
  'grey',
];

/** Official mix recipes — PRIMARY + PRIMARY = SECONDARY */
export const MIX_RECIPES: Array<{ a: TileColor; b: TileColor; result: TileColor }> = [
  { a: 'blue', b: 'red', result: 'purple' },
  { a: 'blue', b: 'yellow', result: 'green' },
  { a: 'red', b: 'yellow', result: 'orange' },
  { a: 'red', b: 'white', result: 'pink' },
  { a: 'blue', b: 'white', result: 'cyan' },
  { a: 'black', b: 'white', result: 'grey' },
];

const MERGE_TABLE: Record<string, TileColor> = {};
for (const { a, b, result } of MIX_RECIPES) {
  MERGE_TABLE[`${a}|${b}`] = result;
  MERGE_TABLE[`${b}|${a}`] = result;
}

const TIER: Record<TileColor, number> = {
  red: 0,
  blue: 0,
  yellow: 0,
  white: 0,
  black: 0,
  purple: 1,
  orange: 1,
  green: 1,
  pink: 1,
  cyan: 1,
  grey: 1,
  wildcard: -1,
};

function key(a: TileColor, b: TileColor): string {
  return `${a}|${b}`;
}

export function getTier(color: TileColor): number {
  return TIER[color];
}

export function isPrimary(color: TileColor): boolean {
  return PRIMARY_COLORS.includes(color);
}

export function isSecondary(color: TileColor): boolean {
  return SECONDARY_COLORS.includes(color);
}

/** Which two base colors mix into this secondary (per help screen). */
export function getPrimaryRecipe(secondary: TileColor): [TileColor, TileColor] | null {
  const recipe = MIX_RECIPES.find((r) => r.result === secondary);
  return recipe ? [recipe.a, recipe.b] : null;
}

export function getRecipeLabel(secondary: TileColor): string {
  const recipe = getPrimaryRecipe(secondary);
  if (!recipe) return '';
  const fmt = (c: TileColor) => c.charAt(0).toUpperCase() + c.slice(1);
  return `${fmt(recipe[0])} + ${fmt(recipe[1])}`;
}

/** Whether a tile color can be selected while pursuing this secondary goal. */
export function isPrimaryForGoal(color: TileColor, goal: TileColor | null): boolean {
  if (!goal) return true;
  if (color === 'wildcard') return true;
  const recipe = getPrimaryRecipe(goal);
  if (!recipe) return true;
  return recipe[0] === color || recipe[1] === color;
}

/** Whether mixing two colors is allowed for the current secondary goal. */
export function isMergeAllowedForGoal(
  a: TileColor,
  b: TileColor,
  goal: TileColor | null,
): boolean {
  const result = merge(a, b);
  if (!result) return false;
  if (!goal) return true;
  return result === goal;
}

export function canMerge(a: TileColor, b: TileColor): boolean {
  if (isSecondary(a) || isSecondary(b)) return false;
  if (a === 'wildcard' || b === 'wildcard') {
    return a !== b;
  }
  return key(a, b) in MERGE_TABLE;
}

export function merge(a: TileColor, b: TileColor): TileColor | null {
  if (isSecondary(a) || isSecondary(b)) return null;
  if (a === 'wildcard' && b === 'wildcard') return null;
  if (a === 'wildcard') return resolveWildcardMerge(b);
  if (b === 'wildcard') return resolveWildcardMerge(a);
  return MERGE_TABLE[key(a, b)] ?? null;
}

export function resolveWildcardMerge(partner: TileColor): TileColor | null {
  if (partner === 'wildcard') return null;

  let best: TileColor | null = null;
  let bestTier = -1;

  for (const other of PRIMARY_COLORS) {
    if (other === partner) continue;
    const result = MERGE_TABLE[key(partner, other)];
    if (result) {
      const tier = getTier(result);
      if (tier > bestTier) {
        best = result;
        bestTier = tier;
      }
    }
  }

  return best;
}

export const TILE_COLORS: Record<TileColor, { fill: number; glow: number; border: number }> = {
  red: { fill: 0xe82050, glow: 0xff4477, border: 0xff88aa },
  blue: { fill: 0x2060e8, glow: 0x4488ff, border: 0x88bbff },
  yellow: { fill: 0xe8c020, glow: 0xffdd44, border: 0xffee88 },
  white: { fill: 0xf0f0f0, glow: 0xffffff, border: 0xcccccc },
  black: { fill: 0x222222, glow: 0x444444, border: 0x666666 },
  purple: { fill: 0x9020c8, glow: 0xbb55ff, border: 0xdd99ff },
  orange: { fill: 0xe87020, glow: 0xff9944, border: 0xffbb77 },
  green: { fill: 0x20b050, glow: 0x44dd77, border: 0x88ffaa },
  pink: { fill: 0xff66aa, glow: 0xff88cc, border: 0xffaadd },
  cyan: { fill: 0x22cccc, glow: 0x55ffff, border: 0x88ffff },
  grey: { fill: 0x888888, glow: 0xaaaaaa, border: 0xcccccc },
  wildcard: { fill: 0xffffff, glow: 0xff66ff, border: 0xff00ff },
};

export const HIGH_CONTRAST_COLORS: Record<TileColor, { fill: number; border: number }> = {
  red: { fill: 0xff0000, border: 0xffffff },
  blue: { fill: 0x0000ff, border: 0xffffff },
  yellow: { fill: 0xffff00, border: 0x000000 },
  white: { fill: 0xffffff, border: 0x000000 },
  black: { fill: 0x000000, border: 0xffffff },
  purple: { fill: 0x9900ff, border: 0xffffff },
  orange: { fill: 0xff6600, border: 0xffffff },
  green: { fill: 0x00ff00, border: 0xffffff },
  pink: { fill: 0xff66aa, border: 0xffffff },
  cyan: { fill: 0x00ffff, border: 0xffffff },
  grey: { fill: 0x888888, border: 0xffffff },
  wildcard: { fill: 0xffffff, border: 0xff00ff },
};

export const TILE_SHAPES: Record<TileColor, string> = {
  red: '●',
  blue: '■',
  yellow: '▲',
  white: '○',
  black: '◆',
  purple: '●■',
  orange: '●▲',
  green: '■▲',
  pink: '●○',
  cyan: '■○',
  grey: '◆○',
  wildcard: '★',
};
