import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet, View, SafeAreaView, Image, Pressable,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
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
import { isNumber } from '@/lib/helpers';

export default function GameScreen() {
  const boardRef = useRef<BoardHandle>(null);
  const numberPadRef = useRef<NumberPadHandle>(null);
  const initializedRef = useRef(false);
  const layout = useLayoutContext();

  const {
    game, playing, loading, difficulty, errors, pad,
    levelRange, levelValue, records,
    setPlaying, setLoading, setStoreError,
    updatePad, incrementError, resetErrors,
    newGame, restartGame, loadFromStore, saveToStore, updateRecord,
  } = useGameStore();

  const timer = useTimer();

  // Initialize on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    Store.setErrorMethod((error) => setStoreError(error));

    (async () => {
      const first = await Store.get('first');
      if (first == null) {
        router.push('/help');
      } else {
        const loaded = await loadFromStore();
        if (loaded) {
          const elapsed = await Store.get<number>('elapsed') ?? 0;
          timer.setElapsed(elapsed);
        } else {
          startNewGame();
        }
        router.push('/menu');
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync board when game state changes
  useEffect(() => {
    if (game.length > 0 && boardRef.current) {
      boardRef.current.resetGame(game);
      updatePad(game);
      numberPadRef.current?.resetPadCells(useGameStore.getState().pad);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const startNewGame = useCallback(async () => {
    timer.reset();
    const currentRange = useGameStore.getState().levelRange;
    await newGame(currentRange);
  }, [newGame, timer]);

  const storeElapsed = useCallback(async () => {
    const time = timer.getElapsed();
    await Store.set('elapsed', time);
  }, [timer]);

  const onInit = useCallback(() => {
    setPlaying(true);
    resetErrors();
    timer.start();
  }, [setPlaying, resetErrors, timer]);

  const onErrorMove = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    incrementError();
  }, [incrementError]);

  const onFinish = useCallback(async () => {
    const eta = timer.stop();
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
            router.push('/menu');
          },
        },
        { text: Lang.txt('newgame'), onPress: () => handleCreate() },
      ]);
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer, updateRecord, setPlaying]);

  const handleCreate = useCallback(() => {
    setLoading(true);
    timer.reset();
    setTimeout(() => {
      startNewGame();
    }, 100);
  }, [setLoading, timer, startNewGame]);

  const handleRestart = useCallback(async () => {
    timer.reset();
    const restarted = restartGame();
    boardRef.current?.resetGame(restarted);
    resetErrors();
    updatePad(restarted);
    numberPadRef.current?.resetPadCells(useGameStore.getState().pad);
  }, [timer, restartGame, resetErrors, updatePad]);

  const handleResume = useCallback(() => {
    timer.resume();
  }, [timer]);

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

  // Handle pad presses — passed to NumberPad
  const onSingleTap = useCallback((number: number) => {
    boardRef.current?.onPadPress(number, true);
  }, []);

  const onDoubleTap = useCallback((number: number) => {
    return boardRef.current?.onPadPress(number, false) ?? false;
  }, []);

  // App lifecycle
  const onForeground = useCallback(async () => {
    const loaded = await loadFromStore();
    if (loaded) {
      const elapsed = await Store.get<number>('elapsed') ?? 0;
      timer.setElapsed(elapsed);
      boardRef.current?.resetGame(useGameStore.getState().game);
      timer.resume();
    } else {
      startNewGame();
    }
  }, [loadFromStore, timer, startNewGame]);

  const onBackground = useCallback(async () => {
    const elapsed = timer.pause();
    await Store.set('elapsed', elapsed);
  }, [timer]);

  useAppLifecycle(onForeground, onBackground);

  // Menu navigation handlers — exposed via global for menu screen
  useEffect(() => {
    // @ts-expect-error global handlers for menu
    global.__gameHandlers = {
      onResume: handleResume,
      onRestart: handleRestart,
      onCreate: handleCreate,
      showHelp: async () => {
        const elapsed = timer.pause();
        await Store.set('elapsed', elapsed);
      },
      onCloseHelp: () => {
        timer.resume();
      },
      onShowMenu: async () => {
        const elapsed = timer.pause();
        await Store.set('elapsed', elapsed);
      },
    };
    return () => {
      // @ts-expect-error cleanup
      delete global.__gameHandlers;
    };
  }, [handleResume, handleRestart, handleCreate, timer]);

  const { isPortrait, cellSize, boardMargin, width, height } = layout;

  const containerStyle = useMemo(() => ({
    flex: 1,
    flexDirection: isPortrait ? 'column' as const : 'row' as const,
    justifyContent: 'flex-start' as const,
    alignItems: 'center' as const,
    backgroundColor: '#fff',
    margin: boardMargin,
  }), [isPortrait, boardMargin]);

  const controlsStyle = useMemo(() => ({
    marginLeft: BorderWidth * 4,
    marginRight: BorderWidth * 4,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
    ...(isPortrait
      ? { marginTop: cellSize * 0.6, flexDirection: 'row' as const }
      : { marginTop: 0, marginLeft: cellSize * 0.6, flexDirection: 'column' as const }),
  }), [isPortrait, cellSize]);

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
        onInit={onInit}
        onErrorMove={onErrorMove}
        onFinish={onFinish}
      />

      <View style={controlsStyle}>
        <View>
          <TimerDisplay elapsed={timer.elapsed} style={timerStyle} />
          <Pressable onPress={showInfo}>
            <View style={styles.info}>
              <ErrorCounter errors={errors} style={levelInfoStyle} />
            </View>
          </Pressable>
          <View style={buttonBoxStyle}>
            <Pressable onPress={async () => {
              const elapsed = timer.pause();
              await Store.set('elapsed', elapsed);
              router.push('/help');
            }}>
              <Image style={iconSize} source={require('../../assets/images/help.png')} />
            </Pressable>
            <Pressable onPress={async () => {
              const elapsed = timer.pause();
              await Store.set('elapsed', elapsed);
              router.push('/menu');
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
