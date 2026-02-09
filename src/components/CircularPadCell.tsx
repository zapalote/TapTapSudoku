import React, { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Text, View, StyleSheet, Platform, Pressable } from 'react-native';
import { CellSize } from '@/constants/layout';
import CircularProgress from './CircularProgress';
import { useDoubleTap } from '@/hooks/useDoubleTap';

const Diam = CellSize * 1.5;
const activePadColor = '#333';

export interface CircularPadCellHandle {
  resetPadCell: (fillCount: number) => void;
}

interface CircularPadCellProps {
  number: number;
  fillCount: number;
  onSingleTap: (number: number) => void;
  onDoubleTap: (number: number) => boolean;
}

const CircularPadCell = forwardRef<CircularPadCellHandle, CircularPadCellProps>(
  function CircularPadCell({ number, fillCount, onSingleTap, onDoubleTap }, ref) {
    const [count, setCount] = useState(fillCount);

    useImperativeHandle(ref, () => ({
      resetPadCell(newCount: number) {
        setCount(newCount);
      },
    }));

    const handleSingleTap = useCallback(() => {
      onSingleTap(number - 1);
    }, [number, onSingleTap]);

    const handleDoubleTap = useCallback(() => {
      const success = onDoubleTap(number - 1);
      if (success) {
        setCount(prev => prev + 1);
      }
      return success;
    }, [number, onDoubleTap]);

    const handlePress = useDoubleTap(handleSingleTap, handleDoubleTap);

    const fill = count * 11.12;
    const stroke = Diam / 9;
    const disabled = count === 9;

    return (
      <Pressable onPress={handlePress}>
        <CircularProgress
          size={Diam}
          width={stroke}
          fill={fill}
          style={styles.surface}
          tintColor="#999"
          backgroundColor={activePadColor}
        >
          {() => (
            <View style={[styles.padCell, disabled && styles.disabled]}>
              <Text style={styles.padText}>{number}</Text>
            </View>
          )}
        </CircularProgress>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.3,
  },
  surface: {
    backgroundColor: 'transparent',
    margin: 2,
  },
  padCell: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'transparent',
    width: Diam,
    height: Diam,
    flex: 1,
    justifyContent: 'space-around',
    borderRadius: Diam,
  },
  padText: {
    fontSize: Diam / 1.7,
    fontWeight: 'bold',
    textAlign: 'center',
    color: activePadColor,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {},
      android: {
        lineHeight: Math.floor(CellSize * 1.05),
      },
    }),
  },
});

export default CircularPadCell;
