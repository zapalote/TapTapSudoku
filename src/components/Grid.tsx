import React, { forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BorderWidth } from '@/constants/layout';
import { useLayoutContext } from '@/contexts/LayoutContext';
import Cell, { type CellHandle } from './Cell';

const line = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export interface GridHandle {
  cells: (CellHandle | null)[];
}

interface GridProps {
  onPress: (index: number, number: number | null) => void;
}

const Grid = forwardRef<GridHandle, GridProps>(function Grid({ onPress }, ref) {
  const { cellSize } = useLayoutContext();
  const cellRefs = useRef<(CellHandle | null)[]>(new Array(81).fill(null));

  useImperativeHandle(ref, () => ({
    cells: cellRefs.current,
  }));

  const ds = useMemo(() => ({
    container: { width: cellSize * 9 + BorderWidth * 6 },
    grid: { width: cellSize * 3, height: cellSize * 3 },
  }), [cellSize]);

  return (
    <View style={[styles.container, ds.container]}>
      {line.map((_item, i) => (
        <View key={'grid' + i} style={[styles.grid, ds.grid]}>
          {line.map((_item2, j) => {
            const x = (i % 3) * 3 + (j % 3);
            const y = Math.floor(i / 3) * 3 + Math.floor(j / 3);
            const index = x + y * 9;
            return (
              <Cell
                ref={(cellRef) => { cellRefs.current[index] = cellRef; }}
                key={'cell' + index}
                index={index}
                onPress={onPress}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#ddd',
  },
  grid: {
    margin: BorderWidth - 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default Grid;
