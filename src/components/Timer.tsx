import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import { formatTime } from '@/hooks/useTimer';

interface TimerProps {
  elapsed: number;
  style?: TextStyle;
}

export default function TimerDisplay({ elapsed, style }: TimerProps) {
  return (
    <Text style={[styles.text, style]}>{formatTime(elapsed)}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '100',
    fontFamily: 'Menlo',
  },
});
