import sudoku from '../../lib/sudoku';

describe('sudoku engine', () => {
  test('makepuzzle returns an array of 81 elements', () => {
    const puzzle = sudoku.makepuzzle();
    expect(puzzle).toHaveLength(81);
  });

  test('makepuzzle returns numbers 0-8 and nulls', () => {
    const puzzle = sudoku.makepuzzle();
    puzzle.forEach((cell) => {
      if (cell !== null && cell !== undefined) {
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThanOrEqual(8);
      }
    });
  });

  test('solvepuzzle solves a valid puzzle', () => {
    const puzzle = sudoku.makepuzzle();
    const solution = sudoku.solvepuzzle(puzzle);
    expect(solution).not.toBeNull();
    expect(solution).toHaveLength(81);
    solution!.forEach((cell) => {
      expect(cell).toBeGreaterThanOrEqual(0);
      expect(cell).toBeLessThanOrEqual(8);
    });
  });

  test('solution contains all given clues', () => {
    const puzzle = sudoku.makepuzzle();
    const solution = sudoku.solvepuzzle(puzzle);
    puzzle.forEach((cell, i) => {
      if (cell !== null && cell !== undefined) {
        expect(solution![i]).toBe(cell);
      }
    });
  });

  test('ratepuzzle returns a non-negative difficulty', () => {
    const puzzle = sudoku.makepuzzle();
    const rating = sudoku.ratepuzzle(puzzle, 4);
    expect(rating).toBeGreaterThanOrEqual(0);
  });

  test('each row in solution has all 9 digits', () => {
    const puzzle = sudoku.makepuzzle();
    const solution = sudoku.solvepuzzle(puzzle)!;
    for (let row = 0; row < 9; row++) {
      const digits = new Set<number>();
      for (let col = 0; col < 9; col++) {
        digits.add(solution[row * 9 + col]);
      }
      expect(digits.size).toBe(9);
    }
  });

  test('each column in solution has all 9 digits', () => {
    const puzzle = sudoku.makepuzzle();
    const solution = sudoku.solvepuzzle(puzzle)!;
    for (let col = 0; col < 9; col++) {
      const digits = new Set<number>();
      for (let row = 0; row < 9; row++) {
        digits.add(solution[row * 9 + col]);
      }
      expect(digits.size).toBe(9);
    }
  });

  test('each 3x3 box in solution has all 9 digits', () => {
    const puzzle = sudoku.makepuzzle();
    const solution = sudoku.solvepuzzle(puzzle)!;
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const digits = new Set<number>();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            digits.add(solution[row * 9 + col]);
          }
        }
        expect(digits.size).toBe(9);
      }
    }
  });
});
