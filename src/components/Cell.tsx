import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Animated, Platform, Text, Pressable } from 'react-native';
import { CellSize } from '@/constants/layout';

export interface CellHandle {
  setNumber: (number: number, fixed: boolean) => void;
  setHintNumber: (number: number) => number[];
  removeHint: (number: number) => number[];
  setHighlight: (highlight: boolean) => void;
  setGlow: (glow: boolean) => void;
  setError: (error: boolean) => void;
  animate: () => void;
  reset: () => void;
}

interface CellProps {
  index: number;
  onPress: (index: number, number: number | null) => void;
}

const Cell = forwardRef<CellHandle, CellProps>(function Cell({ index, onPress }, ref) {
  const [number, setNumberState] = useState<number | null>(null);
  const [hints, setHints] = useState<number[]>([]);
  const [pencil, setPencil] = useState(false);
  const [highlight, setHighlightState] = useState(false);
  const [glow, setGlowState] = useState(false);
  const [error, setErrorState] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [toggle, setToggle] = useState(false);
  const [anim] = useState(() => new Animated.Value(0));

  useImperativeHandle(ref, () => ({
    setNumber(num: number, isFixed: boolean) {
      setNumberState(num);
      setFixed(isFixed);
      setHints([]);
      setPencil(false);
    },
    setHintNumber(num: number): number[] {
      let newHints: number[];
      setHints(prev => {
        if (prev.includes(num)) {
          newHints = prev.filter(x => x !== num);
        } else {
          newHints = [...prev];
          if (newHints.length === 6) newHints.shift();
          newHints.push(num);
          newHints.sort((a, b) => a - b);
        }
        return newHints!;
      });
      setPencil(true);
      // Return current hints synchronously for store
      const currentHints = hints.includes(num)
        ? hints.filter(x => x !== num)
        : [...hints, num].sort((a, b) => a - b).slice(-6);
      return currentHints;
    },
    removeHint(num: number): number[] {
      let result: number[] = hints;
      if (hints.includes(num)) {
        result = hints.filter(x => x !== num);
        setHints(result);
      }
      return result;
    },
    setHighlight(h: boolean) {
      setHighlightState(h);
    },
    setGlow(g: boolean) {
      setGlowState(g);
    },
    setError(e: boolean) {
      setErrorState(e);
    },
    animate() {
      if (toggle) return;
      setToggle(true);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setToggle(false);
      });
    },
    reset() {
      setNumberState(null);
      setHints([]);
      setPencil(false);
      setHighlightState(false);
      setGlowState(false);
      setErrorState(false);
      setFixed(false);
      setToggle(false);
      anim.setValue(0);
    },
  }));

  const handlePress = useCallback(() => {
    onPress(index, number);
  }, [index, number, onPress]);

  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const scale = anim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [1, 1.1, 1.1, 1],
  });
  const transform = [{ rotate }, { scale }];
  const zIndex = toggle ? 100 : 0;
  const filled = typeof number === 'number';
  const text = filled ? String(number + 1) : '';
  const hint = hints.map(x => x + 1).join('');

  let styleArray = [styles.text, fixed && styles.fixedText, highlight && styles.highlightText];
  if (glow) {
    styleArray = [styles.text, styles.glowText];
  }

  return (
    <Animated.View
      style={[
        styles.cell,
        highlight && styles.highlightCell,
        glow && styles.glowCell,
        error && styles.errorCell,
        { transform, zIndex },
      ]}
    >
      {pencil ? (
        <Text style={[styles.text, styles.pencilText]}>{hint}</Text>
      ) : (
        <Text style={styleArray}>{text}</Text>
      )}
      <Pressable
        onPress={handlePress}
        style={styles.handle}
        hitSlop={0}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  handle: {
    width: CellSize,
    height: CellSize,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cell: {
    width: CellSize,
    height: CellSize,
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    color: 'black',
    fontSize: CellSize * 2 / 3,
    fontFamily: 'HelveticaNeue',
  },
  pencilText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    color: 'darkturquoise',
    fontSize: CellSize * 2 / 5,
    marginHorizontal: CellSize / 8,
    ...Platform.select({
      ios: {
        marginTop: CellSize / 12,
        lineHeight: CellSize * 2 / 5,
      },
      android: {
        lineHeight: Math.floor(CellSize * 2 / 4),
      },
    }),
  },
  fixedText: {
    color: '#888',
  },
  highlightCell: {
    borderColor: '#fc0',
    borderWidth: 4,
  },
  highlightText: {
    color: '#c90',
    ...Platform.select({
      ios: {},
      android: {
        lineHeight: Math.floor(CellSize * 0.85),
      },
    }),
  },
  errorCell: {
    borderColor: 'red',
    borderWidth: 4,
  },
  glowCell: {
    borderColor: 'darkturquoise',
    borderWidth: 3,
  },
  glowText: {
    color: 'darkturquoise',
  },
});

export default Cell;
