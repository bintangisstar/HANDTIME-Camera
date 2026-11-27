import { useCallback, useEffect, useRef, useState } from "react";

export type TimerStatus = "idle" | "running" | "done";

/**
 * Countdown driven by wall-clock time, so a throttled tab still finishes
 * on schedule. The status flips to "done" once, which is what triggers the
 * automatic capture.
 */
export function useGestureTimer() {
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const intervalRef = useRef<number | null>(null);
  const endRef = useRef(0);
  const statusRef = useRef<TimerStatus>("idle");

  const clearIntervalRef = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (seconds: number) => {
      if (statusRef.current === "running") return false;

      clearIntervalRef();

      const total = Math.min(9, Math.max(1, Math.round(seconds)));

      statusRef.current = "running";
      setStatus("running");
      setDuration(total);
      setRemaining(total);
      endRef.current = performance.now() + total * 1000;

      intervalRef.current = window.setInterval(() => {
        const leftMs = endRef.current - performance.now();
        const left = Math.max(0, Math.ceil(leftMs / 1000));
        setRemaining(left);

        if (leftMs <= 0) {
          clearIntervalRef();
          statusRef.current = "done";
          setRemaining(0);
          setStatus("done");
        }
      }, 100);

      return true;
    },
    [clearIntervalRef]
  );

  const resetTimer = useCallback(() => {
    clearIntervalRef();
    statusRef.current = "idle";
    setStatus("idle");
    setDuration(0);
    setRemaining(0);
  }, [clearIntervalRef]);

  useEffect(() => clearIntervalRef, [clearIntervalRef]);

  return { status, duration, remaining, startTimer, resetTimer };
}
