import React, { useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet, View, SafeAreaView, Image, Pressable,
  Vibration, Alert, Platform, Linking, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Board, { type BoardHandle } from '@/components/Board';
import NumberPad, { type NumberPadHandle } from '@/components/NumberPad';
import TimerDisplay from '@/components/Timer';
import ErrorCounter from '@/components/ErrorCounter';
import { useTimer, formatTime } from '@/hooks/useTimer';
import { useAppLifecycle } from '@/hooks/useAppLifecycle';
import { useGameStore } from '@/store/game-store';
import {
  Size, CellSize, BorderWidth, BoardMargin,
} from '@/constants/layout';
import Store from '@/lib/storage';
import Lang from '@/lib/language';
import { isNumber } from '@/lib/helpers';

export default function GameScreen() {
  const boardRef = useRef<BoardHandle>(null);
  const numberPadRef = useRef<NumberPadHandle>(null);
  const initializedRef = useRef(false);

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

    const first = Store.get('first');
    if (first === null) {
      Store.set('first', new Date().toDateString());
      startNewGame();
      setTimeout(() => {
        router.push('/help');
      }, 300);
    } else {
      const loaded = loadFromStore();
      if (loaded) {
        const elapsed = Store.get<number>('elapsed') ?? 0;
        timer.setElapsed(elapsed);
      } else {
        startNewGame();
      }
      router.push('/menu');
    }
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

  const startNewGame = useCallback( () => {
    timer.reset();
    const currentRange = useGameStore.getState().levelRange;
    newGame(currentRange);
  }, [newGame, timer]);

  const storeElapsed = useCallback( () => {
    const time = timer.getElapsed();
    Store.set('elapsed', time);
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

  const onFinish = useCallback( () => {
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

  const handleRestart = useCallback( () => {
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
  const onForeground = useCallback(() => {
    const loaded = loadFromStore();
    if (loaded) {
      const elapsed = Store.get<number>('elapsed') ?? 0;
      timer.setElapsed(elapsed);
      boardRef.current?.resetGame(useGameStore.getState().game);
      timer.resume();
    } else {
      startNewGame();
    }
  }, [loadFromStore, timer, startNewGame]);

  const onBackground = useCallback(() => {
    const elapsed = timer.pause();
    Store.set('elapsed', elapsed);
  }, [timer]);

  useAppLifecycle(onForeground, onBackground);

  // Menu navigation handlers — exposed via global for menu screen
  useEffect(() => {
    // @ts-expect-error global handlers for menu
    global.__gameHandlers = {
      onResume: handleResume,
      onRestart: handleRestart,
      onCreate: handleCreate,
      showHelp: () => {
        const elapsed = timer.pause();
        Store.set('elapsed', elapsed);
      },
      onCloseHelp: () => {
        timer.resume();
      },
      onShowMenu: () => {
        const elapsed = timer.pause();
        Store.set('elapsed', elapsed);
      },
    };
    return () => {
      // @ts-expect-error cleanup
      delete global.__gameHandlers;
    };
  }, [handleResume, handleRestart, handleCreate, timer]);

  return (
    <SafeAreaView style={styles.container}>
      <Board
        ref={boardRef}
        game={game}
        reset={true}
        storeElapsed={storeElapsed}
        onInit={onInit}
        onErrorMove={onErrorMove}
        onFinish={onFinish}
      />

      <View style={styles.box}>
        <View style={styles.menuBox}>
          <TimerDisplay elapsed={timer.elapsed} style={styles.timer} />
          <Pressable onPress={showInfo}>
            <View style={styles.info}>
              <ErrorCounter errors={errors} style={styles.levelInfo} />
            </View>
          </Pressable>
          <View style={styles.buttonBox}>
            <Pressable onPress={() => {
              const elapsed = timer.pause();
              Store.set('elapsed', elapsed);
              router.push('/help');
            }}>
              <Image style={styles.menuIcon} source={require('../../assets/images/help.png')} />
            </Pressable>
            <Pressable onPress={() => {
              const elapsed = timer.pause();
              Store.set('elapsed', elapsed);
              router.push('/menu');
            }}>
              <Image style={styles.menuIcon} source={require('../../assets/images/menu.png')} />
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
        <View style={styles.loadingBackground}>
          <View style={styles.loadingBox}>
            <ActivityIndicator color="black" size="large" />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    margin: BoardMargin,
  },
  box: {
    marginTop: CellSize * 0.6,
    marginLeft: BorderWidth * 4,
    marginRight: BorderWidth * 4,
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuBox: {},
  buttonBox: {
    marginTop: CellSize * 0.3,
    width: CellSize * 2.1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuIcon: {
    width: CellSize,
    height: CellSize,
  },
  timer: {
    fontSize: CellSize * 0.65,
    alignSelf: 'flex-start',
    color: '#6b6b6b',
  },
  info: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    justifyContent: 'space-between',
    padding: 2,
  },
  levelInfo: {
    marginLeft: BorderWidth * 2,
    color: '#6b6b6b',
    alignItems: 'flex-start',
    fontSize: CellSize * 3 / 8,
    fontWeight: '100',
    fontFamily: 'Menlo',
  },
  loadingBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: Size.width,
    height: Size.height,
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    opacity: 0.7,
  },
  loadingBox: {
    backgroundColor: 'white',
    opacity: 1,
    height: CellSize * 3,
    width: CellSize * 3,
    borderRadius: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
});
