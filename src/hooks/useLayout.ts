import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

export function useLayout() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isPortrait = height > width;
    const boardPadding = 6;
    const boardMargin = boardPadding / 2;
    const boardWidth = Math.min(
      isPortrait ? width - boardPadding : height - boardPadding,
      500
    );
    const cellSize = Math.floor(boardWidth / 9) - boardMargin;

    return {
      width,
      height,
      isPortrait,
      boardWidth,
      cellSize,
      boardMargin,
      topMargin: isPortrait ? 18 : 6,
      layoutDirection: (isPortrait ? 'column' : 'row') as 'column' | 'row',
    };
  }, [width, height]);
}
