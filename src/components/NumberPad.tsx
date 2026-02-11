import React, { forwardRef, useImperativeHandle, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLayoutContext } from '@/contexts/LayoutContext';
import CircularPadCell, { type CircularPadCellHandle } from './CircularPadCell';

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export interface NumberPadHandle {
  resetPadCells: (pad: number[]) => void;
}

interface NumberPadProps {
  pad: number[];
  onSingleTap: (number: number) => void;
  onDoubleTap: (number: number) => boolean;
}

const NumberPad = forwardRef<NumberPadHandle, NumberPadProps>(
  function NumberPad({ pad, onSingleTap, onDoubleTap }, ref) {
    const { cellSize } = useLayoutContext();
    const padCellRefs = useRef<(CircularPadCellHandle | null)[]>([]);

    useImperativeHandle(ref, () => ({
      resetPadCells(newPad: number[]) {
        numbers.forEach((_n, i) => {
          padCellRefs.current[i]?.resetPadCell(newPad[i]);
        });
      },
    }));

    const ds = useMemo(() => ({
      container: { width: cellSize * 5, height: cellSize * 5 },
    }), [cellSize]);

    return (
      <View style={[styles.container, ds.container]}>
        {numbers.map((item, i) => (
          <CircularPadCell
            ref={(cellRef) => { padCellRefs.current[i] = cellRef; }}
            fillCount={pad[i]}
            key={'pad' + i}
            number={item}
            onSingleTap={onSingleTap}
            onDoubleTap={onDoubleTap}
          />
        ))}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default NumberPad;
