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

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    startTimeRef.current = new Date();
    pausedRef.current = false;
    setPaused(false);
    intervalRef.current = setInterval(() => {
      if (pausedRef.current) return;
      if (!startTimeRef.current) return;
      const now = new Date();
      const newElapsed = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000) + lastElapsedRef.current;
      setElapsed(prev => prev !== newElapsed ? newElapsed : prev);
    }, 100);
  }, [clearTimer]);

  const pause = useCallback((): number => {
    pausedRef.current = true;
    setPaused(true);
    lastElapsedRef.current = elapsed;
    return elapsed;
  }, [elapsed]);

  const resume = useCallback(() => {
    pausedRef.current = false;
    setPaused(false);
    startTimeRef.current = new Date();
  }, []);

  const stop = useCallback((): number => {
    clearTimer();
    if (pausedRef.current) {
      pausedRef.current = false;
      setPaused(false);
    }
    return elapsed;
  }, [clearTimer, elapsed]);

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
    return elapsed;
  }, [elapsed]);

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
