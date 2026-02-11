import React, { useState, useCallback, useImperativeHandle, forwardRef, useRef, useMemo } from 'react';
import { StyleSheet, Platform, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useLayoutContext } from '@/contexts/LayoutContext';

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
  const { cellSize } = useLayoutContext();
  const [number, setNumberState] = useState<number | null>(null);
  const [hints, setHints] = useState<number[]>([]);
  const [pencil, setPencil] = useState(false);
  const [highlight, setHighlightState] = useState(false);
  const [glow, setGlowState] = useState(false);
  const [error, setErrorState] = useState(false);
  const [fixed, setFixed] = useState(false);
  const animatingRef = useRef(false);
  const anim = useSharedValue(0);

  const ds = useMemo(() => ({
    cell: { width: cellSize, height: cellSize },
    handle: { width: cellSize, height: cellSize },
    text: { fontSize: cellSize * 2 / 3 },
    pencilText: {
      fontSize: cellSize * 2 / 5,
      marginHorizontal: cellSize / 8,
      ...Platform.select({
        ios: { marginTop: cellSize / 12, lineHeight: cellSize * 2 / 5 },
        android: { lineHeight: Math.floor(cellSize / 2) },
      }),
    },
    highlightText: Platform.select({
      ios: {},
      android: { lineHeight: Math.floor(cellSize * 0.85) },
    }),
  }), [cellSize]);

  const clearAnimating = useCallback(() => {
    animatingRef.current = false;
  }, []);

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
      if (animatingRef.current) return;
      animatingRef.current = true;
      anim.value = 0;
      anim.value = withTiming(1, { duration: 1000 }, (finished) => {
        if (finished) runOnJS(clearAnimating)();
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
      animatingRef.current = false;
      anim.value = 0;
    },
  }));

  const handlePress = useCallback(() => {
    onPress(index, number);
  }, [index, number, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(anim.value, [0, 1], [0, 360])}deg` },
      { scale: interpolate(anim.value, [0, 0.1, 0.9, 1], [1, 1.1, 1.1, 1]) },
    ],
    zIndex: anim.value > 0 && anim.value < 1 ? 100 : 0,
  }));

  const filled = typeof number === 'number';
  const text = filled ? String(number + 1) : '';
  const hint = hints.map(x => x + 1).join('');

  let styleArray = [styles.text, ds.text, fixed && styles.fixedText, highlight && styles.highlightText, highlight && ds.highlightText];
  if (glow) {
    styleArray = [styles.text, ds.text, styles.glowText];
  }

  return (
    <Animated.View
      style={[
        styles.cell,
        ds.cell,
        highlight && styles.highlightCell,
        glow && styles.glowCell,
        error && styles.errorCell,
        animatedStyle,
      ]}
    >
      {pencil ? (
        <Text style={[styles.text, ds.text, styles.pencilText, ds.pencilText]}>{hint}</Text>
      ) : (
        <Text style={styleArray}>{text}</Text>
      )}
      <Pressable
        onPress={handlePress}
        style={[styles.handle, ds.handle]}
        hitSlop={0}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  handle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cell: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    color: 'black',
    fontFamily: 'HelveticaNeue',
  },
  pencilText: {
    textAlign: 'center',
    textAlignVertical: 'center',
    color: 'darkturquoise',
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