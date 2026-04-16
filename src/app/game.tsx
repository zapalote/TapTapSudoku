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
import { isNumber } from '@/lib/helpers';
import gameHandlers from '@/lib/gameHandlers';

export default function GameScreen() {
  const boardRef = useRef<BoardHandle>(null);
  const numberPadRef = useRef<NumberPadHandle>(null);
  const initializedRef = useRef(false);
  const { isPortrait, cellSize, boardMargin } = useLayoutContext();
  const { fromFirstTime } = useLocalSearchParams<{ fromFirstTime?: string }>();

  const {
    game, playing, loading, difficulty, errors, pad,
    levelRange, levelValue, records,
    setPlaying, setLoading, setStoreError,
    updatePad, incrementError, resetErrors,
    newGame, restartGame, loadFromStore, saveToStore, updateRecord,
  } = useGameStore();

  const timer = useTimer();
  // Destructure stable method references so useCallback deps don't change on every render.
  // pause/resume/reset/start/setElapsed are all useCallback(fn, []) in useTimer.
  const { pause: timerPause, resume: timerResume, reset: timerReset,
          start: timerStart, stop: timerStop, setElapsed: timerSetElapsed, getElapsed: timerGetElapsed } = timer;

  useLayoutEffect(() => {
    unlockOrientation();
  }, []);

  // Pause when game loses focus (menu/help on top); resume when it regains focus.
  // Using stable method refs so this only fires on actual focus changes, not every render.
  useFocusEffect(useCallback(() => {
    if (useGameStore.getState().playing) {
      timerResume();
    }
    return () => {
      Store.set('elapsed', timerPause());
    };
  }, [timerPause, timerResume]));

  // Initialize on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    Store.setErrorMethod((error) => setStoreError(error));

    if (fromFirstTime !== 'true') {
      // Returning user — load saved game or start fresh.
      const loaded = loadFromStore();
      if (loaded) {
        const elapsed = Store.get<number>('elapsed') ?? 0;
        timerSetElapsed(elapsed);
      } else {
        startNewGame();
      }
    } else {
      // First-time user: start a game so the board is ready behind the menu.
      startNewGame();
    }
    // Always show the menu on startup. useFocusEffect cleanup pauses the timer
    // when the game screen loses focus to the menu.
    setTimeout(() => router.push('/menu'), 300);
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
    timerReset();
    const currentRange = useGameStore.getState().levelRange;
    newGame(currentRange);
  }, [newGame, timerReset]);

  const storeElapsed = useCallback( () => {
    const time = timerGetElapsed();
    Store.set('elapsed', time);
  }, [timerGetElapsed]);

  const onInit = useCallback(() => {
    setPlaying(true);
    resetErrors();
    timerStart();
  }, [setPlaying, resetErrors, timerStart]);

  const onErrorMove = useCallback(async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    incrementError();
  }, [incrementError]);

  const onFinish = useCallback( () => {
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
            router.push('/menu');
          },
        },
        { text: Lang.txt('newgame'), onPress: () => handleCreate() },
      ]);
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStop, updateRecord, setPlaying]);

  const handleCreate = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      startNewGame();
    }, 100);
  }, [setLoading, startNewGame]);

  const handleRestart = useCallback( () => {
    timerReset();
    const restarted = restartGame();
    boardRef.current?.resetGame(restarted);
    resetErrors();
    updatePad(restarted);
    numberPadRef.current?.resetPadCells(useGameStore.getState().pad);
  }, [timerReset, restartGame, resetErrors, updatePad]);

  const handleResume = useCallback(() => {
    timerResume();
  }, [timerResume]);

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
    // If a game is already in memory, don't reload from the store — just resume.
    // On Android, orientation changes (e.g. from lockPortrait in help/menu) trigger
    // spurious AppState events that would otherwise clear and re-render the board.
    if (useGameStore.getState().game.length > 0) {
      // Game already in memory — just resume. Don't call setElapsed here;
      // it resets the start reference and causes oscillation when combined
      // with the focus-based resume in menu/help.
      timerResume();
      return;
    }
    const loaded = loadFromStore();
    if (loaded) {
      const elapsed = Store.get<number>('elapsed') ?? 0;
      timerSetElapsed(elapsed);
      timerResume();
    } else {
      startNewGame();
    }
  }, [loadFromStore, timerResume, timerSetElapsed, startNewGame]);

  const onBackground = useCallback(() => {
    const elapsed = timerPause();
    Store.set('elapsed', elapsed);
  }, [timerPause]);

  useAppLifecycle(onForeground, onBackground);

  // Keep the shared gameHandlers module current on every render.
  gameHandlers.onResume = handleResume;
  gameHandlers.onRestart = handleRestart;
  gameHandlers.onCreate = handleCreate;
  gameHandlers.showHelp = () => { Store.set('elapsed', timerPause()); };
  gameHandlers.onCloseHelp = () => { timerResume(); };
  gameHandlers.onShowMenu = () => { Store.set('elapsed', timerPause()); };

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
  }), [isPortrait, cellSize]);

  const ctrlColummnOne = useMemo(() => ({
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
        onInit={onInit}
        onErrorMove={onErrorMove}
        onFinish={onFinish}
      />

      <View style={controlsStyle}>
        <View style={ctrlColummnOne}>
          <TimerDisplay elapsed={timer.elapsed} style={timerStyle} />
          <Pressable onPress={showInfo}>
            <View style={styles.info}>
              <ErrorCounter errors={errors} style={levelInfoStyle} />
            </View>
          </Pressable>
          <View style={buttonBoxStyle}>
            <Pressable onPress={async () => {
              const elapsed = timerPause();
              Store.set('elapsed', elapsed);
              router.push('/help');
            }}>
              <Image style={iconSize} source={require('../../assets/images/help.png')} />
            </Pressable>
            <Pressable onPress={() => {
              const elapsed = timerPause();
              Store.set('elapsed', elapsed);
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
