import { Dimensions } from 'react-native';

const window = Dimensions.get('window');

export const Size = { width: window.width, height: window.height };
const BoardPadding = 6;
export const BoardMargin = BoardPadding / 2;
export const BorderWidth = 2;
export const BoardWidth =
  Math.min(
    (Size.height > Size.width) ? Size.width - BoardPadding : Size.height - BoardPadding,
    500
  );
export const CellSize = Math.floor(BoardWidth / 9) - BoardMargin;
