import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function useAppLifecycle(
  onForeground: () => void,
  onBackground: () => void,
) {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        onForeground();
      } else if (nextAppState.match(/inactive|background/)) {
        onBackground();
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [onForeground, onBackground]);
}
