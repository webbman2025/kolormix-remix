export type TileColor =
  | 'red'
  | 'blue'
  | 'yellow'
  | 'white'
  | 'black'
  | 'purple'
  | 'orange'
  | 'green'
  | 'pink'
  | 'cyan'
  | 'grey'
  | 'wildcard';

/** Base colors that spawn on the board. */
export type PrimaryColor = 'red' | 'blue' | 'yellow' | 'white' | 'black';

export interface Cell {
  color: TileColor | null;
}

export interface MergeResult {
  success: boolean;
  resultColor?: TileColor;
  scoreDelta: number;
  comboBonus: number;
  isCombo: boolean;
}

export interface Position {
  col: number;
  row: number;
}

/** A tile sliding down within its column after a clear. */
export interface TileMove {
  col: number;
  fromRow: number;
  toRow: number;
}

/** A new primary spawned above the column and dropped in. */
export interface TileSpawn {
  col: number;
  row: number;
  color: TileColor;
}

export interface GravityResult {
  moves: TileMove[];
  spawns: TileSpawn[];
}

/** Secondary tile spawned when a wildcard bonus is activated. */
export interface WildcardSpawn {
  col: number;
  row: number;
  color: TileColor;
}
