import { create } from 'zustand';
import type { CellData } from '@/types/game';
import sudoku from '@/lib/sudoku';
import Store from '@/lib/storage';
import { isNumber } from '@/lib/helpers';

interface GameState {
  // Game data
  game: (CellData | undefined)[];
  playing: boolean;
  loading: boolean;
  difficulty: number;
  elapsed: number;
  errors: number;
  records: number[];
  pad: number[];
  levelRange: number[];
  levelValue: number;
  firstTime: string | null;
  storeError: unknown | null;

  // Actions
  setStoreError: (error: unknown | null) => void;
  setLoading: (loading: boolean) => void;
  setPlaying: (playing: boolean) => void;
  setLevelRange: (range: number[]) => void;
  setLevelValue: (value: number) => void;
  setFirstTime: (time: string) => void;
  setElapsed: (elapsed: number) => void;
  incrementError: () => void;
  resetErrors: () => void;
  updatePad: (game: (CellData | undefined)[]) => void;
  setRecords: (records: number[]) => void;
  updateRecord: (difficulty: number, time: number) => boolean;

  // Game lifecycle
  newGame: (levelRange: number[]) => {
    game: (CellData | undefined)[];
    difficulty: number;
  };
  restartGame: () => (CellData | undefined)[];
  loadFromStore: () => boolean;
  saveToStore: (elapsedTime: number) => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  game: [],
  playing: false,
  loading: false,
  difficulty: 0,
  elapsed: 0,
  errors: 0,
  records: new Array(8).fill(3600),
  pad: new Array(9).fill(0),
  levelRange: [0, 1],
  levelValue: 0,
  firstTime: null,
  storeError: null,

  setStoreError: (error) => set({ storeError: error }),
  setLoading: (loading) => set({ loading }),
  setPlaying: (playing) => set({ playing }),
  setLevelRange: (range) => set({ levelRange: range }),
  setLevelValue: (value) => set({ levelValue: value }),
  setFirstTime: (time) => set({ firstTime: time }),
  setElapsed: (elapsed) => set({ elapsed }),
  incrementError: () => {
    const errors = get().errors + 1;
    set({ errors });
    Store.set('error', errors);
  },
  resetErrors: () => {
    set({ errors: 0 });
    Store.set('error', 0);
  },

  updatePad: (game) => {
    const pad = new Array(9).fill(0);
    game.forEach((cell) => {
      if (cell && isNumber(cell.n)) {
        pad[cell.n!]++;
      }
    });
    set({ pad });
  },

  setRecords: (records) => set({ records }),

  updateRecord: (difficulty, time) => {
    const records = [...get().records];
    if (time < records[difficulty]) {
      records[difficulty] = time;
      set({ records });
      Store.set('records', records);
      return true;
    }
    return false;
  },

  newGame: (levelRange) => {
    let puzzle: (number | null)[];
    let d: number;

    do {
      puzzle = sudoku.makepuzzle();
      d = sudoku.ratepuzzle(puzzle, 4);
    } while (!levelRange.includes(d));

    const game: (CellData | undefined)[] = [];
    for (let i = 0; i < 81; i++) {
      const number = puzzle[i];
      if (isNumber(number)) {
        game[i] = { idx: i, type: 'F', n: number };
      }
    }

    set({
      game,
      difficulty: d,
      errors: 0,
      loading: false,
      playing: true,
    });

    Store.set('error', 0);
    Store.set('board', game);

    return { game, difficulty: d };
  },

  restartGame: () => {
    const { game: currentGame } = get();
    const game: (CellData | undefined)[] = [];
    currentGame.forEach((cell, idx) => {
      if (cell && cell.type === 'F') {
        game[idx] = currentGame[idx];
      }
    });

    set({
      game,
      errors: 0,
      playing: true,
    });

    Store.set('board', game);
    Store.set('error', 0);

    return game;
  },

  loadFromStore: () => {
    set({ storeError: null });
    Store.setErrorMethod((error) => set({ storeError: error }));

    const recs = Store.get<number[]>('records');
    if (recs) set({ records: recs });

    const game = Store.get<(CellData | undefined)[]>('board');
    if (game === null || get().storeError) {
      set({ playing: false, game: [] });
      return false;
    }

    const elapsed =  Store.get<number>('elapsed') ?? 0;
    const errors = Store.get<number>('error') ?? 0;
    const levelRange = Store.get<number[]>('levelRange') ?? [0, 1];
    const levelValue = Store.get<number>('levelValue') ?? 0;

    set({
      game,
      playing: true,
      elapsed,
      errors,
      levelRange,
      levelValue,
    });

    return true;
  },

  saveToStore: (elapsedTime) => {
    const { game, errors, records, levelRange, levelValue } = get();
    Store.set('board', game);
    Store.set('elapsed', elapsedTime);
    Store.set('error', errors);
    Store.set('records', records);
    Store.set('levelRange', levelRange);
    Store.set('levelValue', levelValue);
    set({ storeError: null });
  },
}));
