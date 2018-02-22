'use strict';

import { StyleSheet, Dimensions, } from 'react-native';

export const Size = Dimensions.get('window');
export const BoardMargin = 2;
export const BorderWidth = 2;
export const BoardWidth = Math.min((Size.height > Size.width) ? Size.width : Size.height - 6, 500);
export const CellSize = Math.floor(BoardWidth / 9) - BoardMargin;
