import { useState, useRef, useCallback, useEffect } from 'react';

export function formatTime(elapsed: number): string {
  const minute = Math.floor(elapsed / 60);
  const second = elapsed % 60;
  return minute.toString().padStart(2, '0') + ':' + second.toString().padStart(2, '0');
}

export function useTimer(initialElapsed = 0) {
  const [elapsed, setElapsed] = useState(initialElapsed);
  const [paused, setPaused] = useState(false);
  const startTimeRef = useRef<Date | null>(null);
  const lastElapsedRef = useRef(initialElapsed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  // Ref-tracked elapsed so pause() doesn't need it in its closure (keeps pause stable).
  const elapsedRef = useRef(initialElapsed);
  elapsedRef.current = elapsed;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const createInterval = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      if (!startTimeRef.current) return;
      const now = new Date();
      const newElapsed = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000) + lastElapsedRef.current;
      setElapsed(prev => prev !== newElapsed ? newElapsed : prev);
    }, 100);
  }, [clearTimer]);

  const start = useCallback(() => {
    lastElapsedRef.current = 0;
    startTimeRef.current = new Date();
    pausedRef.current = false;
    setPaused(false);
    setElapsed(0);
    createInterval();
  }, [createInterval]);

  // pause() is stable (no closure on elapsed — uses elapsedRef instead).
  const pause = useCallback((): number => {
    pausedRef.current = true;
    setPaused(true);
    lastElapsedRef.current = elapsedRef.current;
    return elapsedRef.current;
  }, []);

  // resume() is stable. Always recreates the interval — the OS can kill setInterval
  // when the app is backgrounded, so we can't rely on the old one still firing.
  const resume = useCallback(() => {
    if (!pausedRef.current && intervalRef.current !== null) return; // truly running
    pausedRef.current = false;
    setPaused(false);
    startTimeRef.current = new Date();
    createInterval(); // always recreate: handles OS timer kill on background
  }, [createInterval]);

  const stop = useCallback((): number => {
    clearTimer();
    pausedRef.current = false;
    setPaused(false);
    return elapsedRef.current;
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    startTimeRef.current = null;
    lastElapsedRef.current = 0;
    pausedRef.current = false;
    setPaused(false);
    setElapsed(0);
  }, [clearTimer]);

  const setElapsedValue = useCallback((value: number) => {
    startTimeRef.current = null;
    lastElapsedRef.current = value;
    setElapsed(value);
  }, []);

  const getElapsed = useCallback((): number => {
    return elapsedRef.current;
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    elapsed,
    paused,
    start,
    pause,
    resume,
    stop,
    reset,
    setElapsed: setElapsedValue,
    getElapsed,
  };
}
