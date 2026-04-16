import React, { useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import {
  StyleSheet, View, Image, Pressable,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Board, { type BoardHandle } from '@/components/Board';
import NumberPad, { type NumberPadHandle } from '@/components/NumberPad';
import TimerDisplay from '@/components/Timer';
import ErrorCounter from '@/components/ErrorCounter';
import { useTimer, formatTime } from '@/hooks/useTimer';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';
import { useLayoutContext } from '@/contexts/LayoutContext';
import { useGameStore } from '@/store/game-store';
import { BorderWidth } from '@/constants/layout';
import Store from '@/lib/storage';
import Lang from '@/lib/language';
import { unlockOrientation } from '@/hooks/useLayout';

export default function GameScreen() {
  const boardRef = useRef<BoardHandle>(null);
  const numberPadRef = useRef<NumberPadHandle>(null);
  // Prevents useFocusEffect from resuming the timer before the init effect has run.
  const initializedRef = useRef(false);
  // Set by init effect; read by useEffect([game]) to know whether to start or resume the timer.
  const timerActionRef = useRef<'start' | 'resume'>('start');

  const { isPortrait, cellSize, boardMargin } = useLayoutContext();
  const { action } = useLocalSearchParams<{ action?: string }>();

  const {
    game, loading, errors, pad,
    setPlaying, setLoading, setStoreError,
    updatePad, incrementError, resetErrors,
    newGame, restartGame, loadFromStore, updateRecord,
  } = useGameStore();

  const timer = useTimer();
  const { pause: timerPause, resume: timerResume, reset: timerReset,
          start: timerStart, stop: timerStop, setElapsed: timerSetElapsed,
          getElapsed: timerGetElapsed } = timer;

  useLayoutEffect(() => {
    unlockOrientation();
  }, []);

  // Pause timer when leaving (to help), resume when returning.
  // initializedRef prevents a spurious resume on the very first mount before
  // the action has been executed.
  useFocusEffect(useCallback(() => {
    if (initializedRef.current && useGameStore.getState().playing) {
      timerResume();
    }
    return () => {
      Store.set('elapsed', timerPause());
    };
  }, [timerPause, timerResume]));

  // Execute the navigation action on mount.
  // The game screen is always freshly mounted (router.replace from menu),
  // so this runs exactly once per user-initiated action.
  useEffect(() => {
    initializedRef.current = true;
    Store.setErrorMethod((error) => setStoreError(error));

    if (action === 'new') {
      resetErrors();
      timerReset();
      timerActionRef.current = 'start';
      setLoading(true);
      setTimeout(() => {
        newGame(useGameStore.getState().levelRange);
      }, 100);
    } else if (action === 'restart') {
      resetErrors();
      timerReset();
      timerActionRef.current = 'start';
      restartGame();
    } else {
      // 'continue' (default) — always reload from store for safety
      const loaded = loadFromStore();
      if (loaded) {
        timerActionRef.current = 'resume';
      } else {
        // No saved game: fall back to a new game
        resetErrors();
        timerReset();
        timerActionRef.current = 'start';
        setLoading(true);
        setTimeout(() => {
          newGame(useGameStore.getState().levelRange);
        }, 100);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync board whenever game state changes, then start or resume the timer.
  useEffect(() => {
    if (game.length > 0 && boardRef.current) {
      boardRef.current.resetGame(game);
      updatePad(game);
      numberPadRef.current?.resetPadCells(useGameStore.getState().pad);

      if (timerActionRef.current === 'resume') {
        const elapsed = Store.get<number>('elapsed') ?? 0;
        timerSetElapsed(elapsed);
        timerResume();
      } else {
        timerStart();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const storeElapsed = useCallback(() => {
    Store.set('elapsed', timerGetElapsed());
  }, [timerGetElapsed]);

  const onErrorMove = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    incrementError();
  }, [incrementError]);

  const onFinish = useCallback(() => {
    const eta = timerStop();
    Store.remove('board');

    const d = useGameStore.getState().difficulty;
    const newRecord = updateRecord(d, eta);
    const msg = (newRecord ? Lang.txt('newrecord') : Lang.txt('success')) + formatTime(eta);

    setTimeout(() => {
      Alert.alert(Lang.txt('congrats'), msg, [
        {
          text: Lang.txt('ok'),
          onPress: () => {
            setPlaying(false);
            router.replace('/menu');
          },
        },
        {
          text: Lang.txt('newgame'),
          onPress: () => {
            resetErrors();
            timerReset();
            timerActionRef.current = 'start';
            setLoading(true);
            setTimeout(() => {
              newGame(useGameStore.getState().levelRange);
            }, 100);
          },
        },
      ]);
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStop, updateRecord, setPlaying, resetErrors, timerReset, setLoading, newGame]);

  // App lifecycle: handle real background/foreground (e.g. user switches apps).
  const onForeground = useCallback(() => {
    if (!initializedRef.current) return;
    if (useGameStore.getState().game.length > 0) {
      timerResume();
    }
  }, [timerResume]);

  const onBackground = useCallback(() => {
    const elapsed = timerPause();
    Store.set('elapsed', elapsed);
  }, [timerPause]);

  useAppLifecycle(onForeground, onBackground);

  const showInfo = useCallback(() => {
    const d = useGameStore.getState().difficulty;
    const recs = useGameStore.getState().records;
    const dots = '\u2022'.repeat(d + 1);
    const record = Lang.txt('record') + formatTime(recs[d]);
    const msg = `${Lang.txt('difficulty') + dots}\n${record}`;

    setTimeout(() => {
      Alert.alert(Lang.txt('Info'), msg, [
        { text: Lang.txt('ok') },
        { text: 'Stop', onPress: () => boardRef.current?.stopIt() },
      ]);
    }, 300);
  }, []);

  // Handle pad presses
  const onSingleTap = useCallback((number: number) => {
    boardRef.current?.onPadPress(number, true);
  }, []);

  const onDoubleTap = useCallback((number: number) => {
    return boardRef.current?.onPadPress(number, false) ?? false;
  }, []);

  const containerStyle = useMemo(() => ({
    flex: 1,
    flexDirection: isPortrait ? 'column' as const : 'row' as const,
    justifyContent: 'flex-start' as const,
    backgroundColor: '#fff',
    margin: boardMargin,
    marginTop: boardMargin + 10,
  }), [isPortrait, boardMargin]);

  const controlsStyle = useMemo(() => ({
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    ...(isPortrait
      ? {
        marginTop: boardMargin + 10,
        marginLeft: cellSize * 0.6,
        flexDirection: 'row' as const }
      : { marginTop: boardMargin + 5,
        marginLeft: cellSize * 0.6,
        flex: 1,
        flexDirection: 'row' as const }),
  }), [isPortrait, cellSize, boardMargin]);

  const ctrlColumnOne = useMemo(() => ({
    flexDirection: 'column' as const,
    alignItems: 'flex-start' as const,
    flex: 1,
  }), []);

  const iconSize = useMemo(() => ({
    width: cellSize,
    height: cellSize,
  }), [cellSize]);

  const timerStyle = useMemo(() => ({
    fontSize: cellSize * 0.65,
    alignSelf: 'flex-start' as const,
    color: '#6b6b6b',
  }), [cellSize]);

  const levelInfoStyle = useMemo(() => ({
    marginLeft: BorderWidth * 2,
    color: '#6b6b6b',
    alignItems: 'flex-start' as const,
    fontSize: cellSize * 3 / 8,
    fontWeight: '100' as const,
    fontFamily: 'Menlo',
  }), [cellSize]);

  const buttonBoxStyle = useMemo(() => ({
    marginTop: cellSize * 0.3,
    width: cellSize * 2.1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  }), [cellSize]);

  const loadingOverlayStyle = useMemo(() => ({
    ...StyleSheet.absoluteFillObject,
    flex: 1,
    alignItems: 'center' as const,
    flexDirection: 'column' as const,
    justifyContent: 'space-around' as const,
    backgroundColor: 'white',
    opacity: 0.7,
  }), []);

  const loadingBoxStyle = useMemo(() => ({
    backgroundColor: 'white',
    opacity: 1,
    height: cellSize * 3,
    width: cellSize * 3,
    borderRadius: 50,
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-around' as const,
  }), [cellSize]);

  return (
    <SafeAreaView style={containerStyle}>
      <Board
        ref={boardRef}
        game={game}
        reset={true}
        storeElapsed={storeElapsed}
        onErrorMove={onErrorMove}
        onFinish={onFinish}
      />

      <View style={controlsStyle}>
        <View style={ctrlColumnOne}>
          <TimerDisplay elapsed={timer.elapsed} style={timerStyle} />
          <Pressable onPress={showInfo}>
            <View style={styles.info}>
              <ErrorCounter errors={errors} style={levelInfoStyle} />
            </View>
          </Pressable>
          <View style={buttonBoxStyle}>
            <Pressable onPress={() => {
              Store.set('elapsed', timerPause());
              router.push('/help');
            }}>
              <Image style={iconSize} source={require('../../assets/images/help.png')} />
            </Pressable>
            <Pressable onPress={() => {
              Store.set('elapsed', timerPause());
              router.replace('/menu');
            }}>
              <Image style={iconSize} source={require('../../assets/images/menu.png')} />
            </Pressable>
          </View>
        </View>
        <NumberPad
          ref={numberPadRef}
          pad={pad}
          onSingleTap={onSingleTap}
          onDoubleTap={onDoubleTap}
        />
      </View>

      {loading && (
        <View style={loadingOverlayStyle}>
          <View style={loadingBoxStyle}>
            <ActivityIndicator color="black" size="large" />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  info: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    justifyContent: 'space-between',
    padding: 2,
  },
});
