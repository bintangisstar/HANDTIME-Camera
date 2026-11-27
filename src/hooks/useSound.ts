import { useCallback, useEffect, useMemo, useRef } from "react";

type BlipOptions = {
  duration?: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
};

/**
 * Tiny WebAudio kit for the booth: countdown blips, a "go" chime and a
 * mechanical shutter. The context is created lazily and resumed inside a
 * user gesture (the start button), otherwise browsers keep it suspended.
 */
export function useSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const getContext = useCallback(() => {
    if (typeof window === "undefined") return null;

    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioCtor) return null;

    if (!ctxRef.current) {
      ctxRef.current = new AudioCtor();
    }

    const ctx = ctxRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  }, []);

  const blip = useCallback(
    (frequency: number, options: BlipOptions = {}) => {
      if (!enabledRef.current) return;

      const ctx = getContext();
      if (!ctx) return;

      const {
        duration = 0.07,
        type = "triangle",
        volume = 0.05,
        delay = 0,
      } = options;

      const start = ctx.currentTime + delay;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.03);
    },
    [getContext]
  );

  const playTick = useCallback(() => {
    blip(740, { duration: 0.055, type: "sine", volume: 0.035 });
  }, [blip]);

  const playGo = useCallback(() => {
    blip(523.25, { duration: 0.09, volume: 0.045 });
    blip(783.99, { duration: 0.14, volume: 0.045, delay: 0.09 });
  }, [blip]);

  const playShutter = useCallback(() => {
    if (!enabledRef.current) return;

    const ctx = getContext();
    if (!ctx) return;

    blip(1180, { duration: 0.03, type: "square", volume: 0.02 });

    const duration = 0.11;
    const frameCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < frameCount; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frameCount) ** 2;
    }

    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = "highpass";
    filter.frequency.value = 1400;
    gain.gain.value = 0.13;

    source.buffer = buffer;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }, [blip, getContext]);

  const prime = useCallback(() => {
    const ctx = getContext();
    void ctx?.resume();
  }, [getContext]);

  useEffect(() => {
    return () => {
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, []);

  return useMemo(
    () => ({ playTick, playGo, playShutter, prime }),
    [playTick, playGo, playShutter, prime]
  );
}
