import { useRef, useCallback } from 'react';

const DOUBLE_TAP_DELAY = 300;

export function useDoubleTap(
  onSingleTap: () => void,
  onDoubleTap: () => boolean,
) {
  const prevTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = useCallback(() => {
    const now = Date.now();
    const dt = now - prevTimeRef.current;

    if (dt < DOUBLE_TAP_DELAY && prevTimeRef.current > 0) {
      // Double tap detected
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      onDoubleTap();
    } else {
      // First tap — wait for possible second tap
      timeoutRef.current = setTimeout(() => {
        onSingleTap();
        timeoutRef.current = null;
      }, DOUBLE_TAP_DELAY);
    }

    prevTimeRef.current = now;
  }, [onSingleTap, onDoubleTap]);

  return handlePress;
}
