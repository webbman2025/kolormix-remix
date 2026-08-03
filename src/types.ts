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
