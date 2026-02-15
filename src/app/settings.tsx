import React, { useMemo, useCallback, useEffect } from 'react';
import { StyleSheet, View, Image, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import RadioGroup from '@/components/RadioGroup';
import { useGameStore } from '@/store/game-store';
import Store from '@/lib/storage';
import Lang from '@/lib/language';
import { Size, CellSize } from '@/constants/layout';
import { lockPortrait, unlockOrientation } from '@/hooks/useLayout';

export default function SettingsScreen() {
  const levelValue = useGameStore((s) => s.levelValue);
  const setLevelRange = useGameStore((s) => s.setLevelRange);
  const setLevelValue = useGameStore((s) => s.setLevelValue);
  const setPlaying = useGameStore((s) => s.setPlaying);

  useEffect(() => {
    lockPortrait();

    return () => {
      unlockOrientation();
    };
  }, []);

  const levels = useMemo(
    () => [
      {
        label: Lang.txt('manageable'),
        value: 2,
        size: CellSize / 1.8,
        range: [0, 1],
        color: '#fc0',
        selected: levelValue === 0,
      },
      {
        label: Lang.txt('challenging'),
        value: 4,
        size: CellSize / 1.8,
        range: [2, 3],
        color: '#fc0',
        selected: levelValue === 1,
      },
      {
        label: Lang.txt('impossible'),
        value: 6,
        size: CellSize / 1.8,
        range: [4, 5, 6, 7],
        color: '#fc0',
        selected: levelValue === 2,
      },
      {
        label: Lang.txt('anylevel'),
        value: 0,
        size: CellSize / 1.8,
        range: [0, 1, 2, 3, 4, 5, 6, 7],
        color: '#fc0',
        selected: levelValue === 3,
      },
    ],
    [levelValue]
  );

  const onSelect = useCallback(
    (radioButtons: Array<{ label: string; selected?: boolean; [key: string]: unknown }>) => {
      const level = radioButtons.findIndex((lev) => lev.selected);
      if (level >= 0) {
        const range = levels[level].range;
        setLevelValue(level);
        setLevelRange(range);
        setPlaying(false);
        Store.set('levelRange', range);
        Store.set('levelValue', level);
      }
    },
    [levels, setLevelValue, setLevelRange, setPlaying]
  );

  return (
    <View style={styles.modal}>
      <View style={styles.modalContainer}>
        <Image
          style={styles.logo}
          source={require('../../assets/images/tap-tap-sudoku.png')}
        />
        <View style={styles.textBlock}>
          <RadioGroup
            radioButtons={levels}
            onPress={onSelect}
            style={styles.radioText}
            heading="LEVEL"
            headingStyle={styles.optionHeading}
          />
        </View>
      </View>
      <View style={styles.footer}>
        <Pressable style={styles.button} onPress={() => router.back()}>
          <Image
            style={styles.buttonIcon}
            source={require('../../assets/images/close.png')}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  textBlock: {
    alignItems: 'center',
    alignSelf: 'center',
    width: CellSize * 6.5,
    marginBottom: CellSize * 0.3,
  },
  logo: {
    alignItems: 'center',
    alignSelf: 'center',
    width: CellSize * 6.5,
    height: CellSize * 6.5,
    marginBottom: CellSize * 0.3,
  },
  optionHeading: {
    fontFamily: Platform.OS === 'ios' ? 'Varela Round' : 'varela',
    fontSize: CellSize / 1.3,
    textAlign: 'center',
    marginBottom: CellSize / 6,
  },
  radioText: {
    fontFamily: Platform.OS === 'ios' ? 'Varela Round' : 'varela',
    fontSize: CellSize / 1.7,
  },
  footer: {
    flexDirection: 'row',
    marginBottom: CellSize / 1.7,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  button: {
    padding: Size.height > 500 ? 10 : 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    width: CellSize,
    height: CellSize,
  },
});
