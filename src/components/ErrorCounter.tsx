import React from 'react';
import { StyleSheet, Text, type TextStyle } from 'react-native';
import Lang from '@/lib/language';

interface ErrorCounterProps {
  errors: number;
  style?: TextStyle;
}

function formatBad(errors: number): string {
  if (errors === 0 || errors > 4) return errors.toString();
  return '\u2715'.repeat(errors);
}

export default function ErrorCounter({ errors, style }: ErrorCounterProps) {
  return (
    <Text style={[styles.text, style]}>
      {Lang.txt('error') + formatBad(errors)}
    </Text>
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
