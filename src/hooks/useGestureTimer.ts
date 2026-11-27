import { useCallback, useEffect, useRef, useState } from "react";

type TimerStatus = "READY" | "RUNNING" | "COMPLETED";

export function useGestureTimer() {
  const [status, setStatus] = useState<TimerStatus>("READY");
  const [duration, setDuration] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const intervalRef = useRef<number | null>(null);

  const startTimer = useCallback((seconds: number) => {
    if (intervalRef.current !== null) return;

    setDuration(seconds);
    setRemaining(seconds);
    setStatus("RUNNING");

    const endTime = Date.now() + seconds * 1000;

    intervalRef.current = window.setInterval(() => {
      const timeLeft = Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000)
      );

      setRemaining(timeLeft);

      if (timeLeft <= 0) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        setStatus("COMPLETED");
      }
    }, 50);
  }, []);

  const resetTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setStatus("READY");
    setDuration(0);
    setRemaining(0);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status,
    duration,
    remaining,
    startTimer,
    resetTimer,
  };
}