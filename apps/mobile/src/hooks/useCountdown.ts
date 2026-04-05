import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    setSecondsLeft(initialSeconds);
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearTimer();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, [clearTimer, initialSeconds]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  return { secondsLeft, start, isRunning: secondsLeft > 0 };
}
