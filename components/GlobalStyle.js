'use strict';

import { Dimensions, } from 'react-native';

export const Size = Dimensions.get('window');
const BoardPadding = 6;
export const BoardMargin = BoardPadding / 2;
export const BorderWidth = 2;
export const BoardWidth =
  Math.min((Size.height > Size.width) ? Size.width - BoardPadding : Size.height - BoardPadding, 500);
export const CellSize = Math.floor(BoardWidth / 9) - BoardMargin;
