import React, { forwardRef, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { CellSize, BoardWidth, BorderWidth } from '@/constants/layout';
import Grid, { type GridHandle } from './Grid';
import { isNumber } from '@/lib/helpers';
import sudoku from '@/lib/sudoku';
import Store from '@/lib/storage';
import type { CellData } from '@/types/game';

const line = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function toXY(index: number) {
  const x = index % 9;
  const y = (index - x) / 9;
  return { x, y };
}

function toZ(index: number) {
  const { x, y } = toXY(index);
  return (x - (x % 3)) / 3 + (y - (y % 3));
}

export interface BoardHandle {
  resetGame: (game: (CellData | undefined)[]) => void;
  onPadPress: (number: number, edit: boolean) => boolean;
  stopIt: () => void;
}

interface BoardProps {
  game: (CellData | undefined)[];
  reset: boolean;
  storeElapsed?: () => void;
  onInit?: () => void;
  onErrorMove?: () => void;
  onFinish?: () => void;
}

const Board = forwardRef<BoardHandle, BoardProps>(function Board(
  { game: gameProp, storeElapsed, onInit, onErrorMove, onFinish },
  ref
) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [solved, setSolved] = useState(false);

  const gridRef = useRef<GridHandle>(null);
  const gameRef = useRef<(CellData | undefined)[]>([]);
  const puzzleRef = useRef<(number | null)[]>(new Array(81).fill(null));
  const highlightNumberRef = useRef<number | null>(null);
  const highlightIndexRef = useRef<number | null>(null);
  const glowNumberRef = useRef<number | null>(null);
  const glowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initedRef = useRef(false);
  const selectedIndexRef = useRef(-1);

  const getCells = useCallback(() => {
    return gridRef.current?.cells ?? [];
  }, []);

  const setHighlight = useCallback((number: number, highlight: boolean) => {
    const cells = getCells();
    const puzzle = puzzleRef.current;
    puzzle.forEach((item, i) => {
      if (isNumber(item) && item === number) {
        cells[i]?.setHighlight(highlight);
      }
    });
  }, [getCells]);

  const setError = useCallback((index: number, toggle: boolean) => {
    const cells = getCells();
    if (errTimeoutRef.current) clearTimeout(errTimeoutRef.current);
    cells[index]?.setError(toggle);
    if (toggle) {
      errTimeoutRef.current = setTimeout(() => {
        setError(index, false);
      }, 1000);
    }
  }, [getCells]);

  const setGlow = useCallback((number: number, glow: boolean) => {
    const cells = getCells();
    const puzzle = puzzleRef.current;
    puzzle.forEach((item, i) => {
      if (isNumber(item) && item === number) {
        cells[i]?.setGlow(glow);
      }
    });
    if (glowTimeoutRef.current) clearTimeout(glowTimeoutRef.current);
    if (glow) {
      glowNumberRef.current = number;
      glowTimeoutRef.current = setTimeout(() => {
        setGlow(number, false);
      }, 2000);
    } else {
      glowNumberRef.current = null;
    }
  }, [getCells]);

  const animateRow = useCallback((row: number) => {
    const cells = getCells();
    line.forEach(i => cells[i + row * 9]?.animate());
  }, [getCells]);

  const animateColumn = useCallback((col: number) => {
    const cells = getCells();
    line.forEach(i => cells[i * 9 + col]?.animate());
  }, [getCells]);

  const animateGrid = useCallback((z: number) => {
    const cells = getCells();
    const x = z % 3;
    const y = (z - x) / 3;
    line.forEach(i => {
      const xx = i % 3;
      const yy = (i - xx) / 3;
      const index = xx + yy * 3 * 3 + y * 27 + x * 3;
      cells[index]?.animate();
    });
  }, [getCells]);

  const stopIt = useCallback(() => {
    setSelectedIndex(-1);
    selectedIndexRef.current = -1;
    setSolved(true);
    onFinish?.();
  }, [onFinish]);

  const storeGame = useCallback((type: string, index: number, number: number | null, hints?: number[]) => {
    const game = gameRef.current;
    switch (type) {
      case 'N':
      case 'F':
        game[index] = { idx: index, n: number!, type: type as 'N' | 'F' };
        break;
      case 'H':
        game[index] = { idx: index, h: JSON.stringify(hints!.slice()), type: 'H' };
        break;
    }
    Store.set('board', game);
    storeElapsed?.();
  }, [storeElapsed]);

  const onCellPress = useCallback((index: number, number: number | null) => {
    if (!initedRef.current || solved) return;

    if (isNumber(number)) {
      if (isNumber(highlightIndexRef.current)) {
        getCells()[highlightIndexRef.current]?.setHighlight(false);
      }
      if (isNumber(highlightNumberRef.current)) {
        setHighlight(highlightNumberRef.current, false);
      }
      setHighlight(number, true);
      highlightNumberRef.current = number;
      setSelectedIndex(-1);
      selectedIndexRef.current = -1;
      return;
    }

    if (index !== selectedIndexRef.current) {
      setSelectedIndex(index);
      selectedIndexRef.current = index;
    }

    if (isNumber(highlightIndexRef.current)) {
      getCells()[highlightIndexRef.current]?.setHighlight(false);
    }
    getCells()[index]?.setHighlight(true);
    highlightIndexRef.current = index;

    if (isNumber(highlightNumberRef.current)) {
      setHighlight(highlightNumberRef.current, false);
      highlightNumberRef.current = null;
    }
  }, [solved, getCells, setHighlight]);

  const onPadPress = useCallback((number: number, edit: boolean): boolean => {
    if (!initedRef.current) return false;
    const cells = getCells();
    const puzzle = puzzleRef.current;
    const game = gameRef.current;
    const index = selectedIndexRef.current;

    if (index === -1) {
      // no cell selected — highlight number
      if (isNumber(highlightNumberRef.current)) {
        setHighlight(highlightNumberRef.current, false);
        if (highlightNumberRef.current === number) {
          highlightNumberRef.current = null;
          return false;
        }
      }
      setHighlight(number, true);
      highlightNumberRef.current = number;
      return false;
    }

    if (edit) {
      // single tap: pencil the number
      const hints = cells[index]?.setHintNumber(number) ?? [];
      if (isNumber(glowNumberRef.current) && glowNumberRef.current !== number) {
        setGlow(glowNumberRef.current, false);
      }
      setGlow(number, true);
      storeGame('H', index, null, hints);
      return false;
    }

    const { x, y } = toXY(index);
    const z = toZ(index);

    // check for collisions
    const collision: number[] = [];
    puzzle.forEach((item, idx) => {
      if (item !== number) return;
      const pos = toXY(idx);
      if (pos.x === x || pos.y === y || toZ(idx) === z) {
        collision.push(idx);
      }
    });

    if (collision.length) {
      setError(index, true);
      collision.forEach(i => cells[i]?.setHighlight(true));
      setTimeout(() => {
        collision.forEach(i => cells[i]?.setHighlight(false));
      }, 800);
      onErrorMove?.();
      return false;
    }

    const test = puzzle.slice();
    test[index] = number;
    if (!sudoku.solvepuzzle(test)) {
      setError(index, true);
      setTimeout(() => {
        onErrorMove?.();
      }, 300);
      return false;
    }

    // lock the number
    cells[index]?.setNumber(number, false);
    puzzle[index] = number;
    storeGame('N', index, number);

    // remove hints in same row/col/box
    cells.forEach((item, idx) => {
      if (item == null) return;
      const pos = toXY(idx);
      if (pos.x === x || pos.y === y || toZ(idx) === z) {
        const hints = cells[idx]?.removeHint(number) ?? [];
        if (game[idx] && game[idx]!.type === 'H') {
          storeGame('H', idx, null, hints);
        }
      }
    });

    // game solved
    if (puzzle.filter(x => x != null).length === 81) {
      cells[index]?.setHighlight(false);
      stopIt();
      return true;
    }
    // grid solved
    if (puzzle.filter((item, idx) => item != null && toZ(idx) === z).length === 9) {
      animateGrid(z);
    }
    // row solved
    if (puzzle.filter((item, idx) => item != null && toXY(idx).y === y).length === 9) {
      animateRow(y);
    }
    // column solved
    if (puzzle.filter((item, idx) => item != null && toXY(idx).x === x).length === 9) {
      animateColumn(x);
    }
    // number solved
    if (puzzle.filter(x => x === number).length === 9) {
      puzzle.forEach((item, i) => {
        if (item === number) cells[i]?.animate();
      });
    }

    // cell solved highlight
    if (isNumber(highlightNumberRef.current)) {
      setHighlight(highlightNumberRef.current, false);
    }
    setHighlight(number, true);
    highlightNumberRef.current = number;

    if (index !== selectedIndexRef.current) return true;
    setSelectedIndex(-1);
    selectedIndexRef.current = -1;

    return true;
  }, [getCells, setHighlight, setGlow, setError, storeGame, stopIt, animateGrid, animateRow, animateColumn, onErrorMove]);

  const resetGame = useCallback((game: (CellData | undefined)[]) => {
    const cells = getCells();
    cells.forEach(cell => cell?.reset());
    gameRef.current = game;

    if (!game) return;

    initedRef.current = false;
    setSolved(false);
    highlightNumberRef.current = null;
    highlightIndexRef.current = null;

    let count = 0;
    puzzleRef.current = new Array(81).fill(null);
    game.forEach((cell) => {
      if (!cell) return;
      count++;
      const i = cell.idx;
      setTimeout(() => {
        switch (cell.type) {
          case 'F':
            cells[i]?.setNumber(cell.n!, true);
            puzzleRef.current[i] = cell.n!;
            break;
          case 'N':
            cells[i]?.setNumber(cell.n!, false);
            puzzleRef.current[i] = cell.n!;
            break;
          case 'H':
            JSON.parse(cell.h!).forEach((item: number) => {
              if (isNumber(item)) cells[i]?.setHintNumber(item);
            });
            break;
        }
      }, 50 * count);
    });
    initedRef.current = true;
    onInit?.();
  }, [getCells, onInit]);

  useImperativeHandle(ref, () => ({
    resetGame,
    onPadPress,
    stopIt,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.board}>
        <Grid ref={gridRef} onPress={onCellPress} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'center',
    width: BoardWidth,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ddd',
    padding: BorderWidth,
  },
});

export default Board;
