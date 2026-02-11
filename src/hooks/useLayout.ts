import { useWindowDimensions } from 'react-native';
import { useMemo, useEffect, useState } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';

export type Orientation = 'portrait' | 'landscape';

export interface LayoutValues {
  width: number;
  height: number;
  orientation: Orientation;
  isPortrait: boolean;
  boardWidth: number;
  cellSize: number;
  boardMargin: number;
  boardPadding: number;
  topMargin: number;
}

export function useLayout(): LayoutValues {
  const { width, height } = useWindowDimensions();
  const [orientation, setOrientation] = useState<Orientation>(
    height >= width ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    // Sync initial orientation from the native API
    ScreenOrientation.getOrientationAsync().then((o) => {
      setOrientation(
        o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
          ? 'landscape'
          : 'portrait'
      );
    });

    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      const o = event.orientationInfo.orientation;
      setOrientation(
        o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
          ? 'landscape'
          : 'portrait'
      );
    });

    return () => ScreenOrientation.removeOrientationChangeListener(subscription);
  }, []);

  return useMemo(() => {
    const isPortrait = orientation === 'portrait';
    const boardPadding = 10;
    const boardMargin = boardPadding / 2;
    const shortSide = Math.min(width, height);
    const boardWidth = Math.min(shortSide - boardPadding, 400);
    const cellSize = Math.floor(boardWidth / 9) - boardMargin;

    return {
      width,
      height,
      orientation,
      isPortrait,
      boardWidth,
      cellSize,
      boardMargin,
      boardPadding,
      topMargin: isPortrait ? 18 : 6,
    };
  }, [width, height, orientation]);
}
