export interface CellData {
  idx: number;
  type: 'F' | 'N' | 'H';
  n?: number;
  h?: string; // JSON-stringified hints array
}

export type Puzzle = (number | null)[];

export type DifficultyLevel = 0 | 1 | 2 | 3;

export interface DifficultyOption {
  label: string;
  value: number;
  size: number;
  range: number[];
  color: string;
  selected?: boolean;
}
