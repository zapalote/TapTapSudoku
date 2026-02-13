'use strict';

import Store from './store';
import sudoku from './sudoku';
import Lang from './language';
import ThemeContext, { ThemeProvider, LightTheme, DarkTheme } from './ThemeContext';

export {
  Store,
  sudoku,
  Lang,
  ThemeContext,
  ThemeProvider,
  LightTheme,
  DarkTheme,
};

export function isNumber(number) {
  return typeof(number) == 'number';
}
