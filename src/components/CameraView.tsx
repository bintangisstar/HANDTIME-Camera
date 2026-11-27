import { useCallback, useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
  Camera,
  HandWaving,
  LightbulbFilament,
  WarningCircle,
} from "@phosphor-icons/react";

import { useGestureTimer } from "../hooks/useGestureTimer";
import { readHand, smoothCount } from "../utils/fingerCounter";
import type { FingerState } from "../utils/fingerCounter";
import CountdownOverlay from "./CountdownOverlay";
import GestureGuide from "./GestureGuide";
import PhotoResult from "./PhotoResult";
import PoseCard from "./PoseCard";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const HOLD_MS = 600;
const HISTORY_SIZE = 5;

const EMPTY_FINGERS: FingerState = [false, false, false, false, false];

type CameraPhase = "loading" | "ready" | "error";

type CameraViewProps = {
  sound: {
    playTick: () => void;
    playGo: () => void;
    playShutter: () => void;
  };
};

function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number
) {
  const radius = Math.max(4, width / 165);

  for (const point of landmarks) {
    const x = point.x * width;
    const y = point.y * height;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "#ffd166";
    ctx.fill();

    ctx.lineWidth = Math.max(1.5, radius * 0.42);
    ctx.strokeStyle = "#241726";
    ctx.stroke();
  }
}

export default function CameraView({ sound }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const holdBarRef = useRef<HTMLDivElement>(null);

  const { playTick, playGo, playShutter } = sound;

  const [phase, setPhase] = useState<CameraPhase>("loading");
  const [loadStep, setLoadStep] = useState("Memuat pendeteksi tangan…");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const [fingerCount, setFingerCount] = useState(0);
  const [fingers, setFingers] = useState<FingerState>(EMPTY_FINGERS);
  const [holding, setHolding] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  const { status, duration, remaining, startTimer, resetTimer } =
    useGestureTimer();

  const statusRef = useRef(status);
  const capturedRef = useRef(false);
  const candidateRef = useRef(0);
  const holdStartRef = useRef(0);
  const triggeredRef = useRef(false);
  const historyRef = useRef<number[]>([]);
  const lastTsRef = useRef(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (status === "running" && remaining > 0) {
      playTick();
    }
  }, [remaining, status, playTick]);

  const retake = useCallback(() => {
    capturedRef.current = false;
    statusRef.current = "idle";
    triggeredRef.current = false;
    candidateRef.current = 0;
    holdStartRef.current = performance.now();
    historyRef.current = [];

    setCapturedImage(null);
    setFingerCount(0);
    setFingers(EMPTY_FINGERS);
    setHolding(false);
    resetTimer();

    if (holdBarRef.current) {
      holdBarRef.current.style.transform = "scaleX(0)";
    }
  }, [resetTimer]);

  const cancelCountdown = useCallback(() => {
    statusRef.current = "idle";
    triggeredRef.current = false;
    candidateRef.current = 0;
    holdStartRef.current = performance.now();
    setHolding(false);
    resetTimer();

    if (holdBarRef.current) {
      holdBarRef.current.style.transform = "scaleX(0)";
    }
  }, [resetTimer]);

  const savePhoto = useCallback(() => {
    if (!capturedImage) return;

    const stamp = new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/[:T]/g, "-");

    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `handtime-${stamp}.jpg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, [capturedImage]);

  const retry = useCallback(() => {
    setErrorMessage("");
    setPhase("loading");
    setLoadStep("Memuat pendeteksi tangan…");
    setRetryKey((key) => key + 1);
  }, []);

  // Camera stream + MediaPipe hand landmarker.
  useEffect(() => {
    let disposed = false;
    let stream: MediaStream | null = null;
    let rafId = 0;
    let landmarker: HandLandmarker | null = null;

    const fail = (message: string) => {
      if (disposed) return;
      setErrorMessage(message);
      setPhase("error");
    };

    const describeError = (error: unknown) => {
      if (
        error instanceof Error &&
        error.message === "MediaDevicesUnavailable"
      ) {
        return "Kamera cuma bisa dipakai lewat HTTPS atau localhost. Buka alamat itu lalu coba lagi.";
      }

      const name = error instanceof DOMException ? error.name : "";

      switch (name) {
        case "NotAllowedError":
        case "SecurityError":
          return "Izin kamera ditolak. Izinkan akses kamera untuk situs ini, lalu tekan coba lagi.";
        case "NotFoundError":
        case "OverconstrainedError":
          return "Tidak ada kamera yang bisa dipakai. Pasang kamera atau coba browser lain.";
        case "NotReadableError":
        case "AbortError":
          return "Kamera sedang dipakai aplikasi lain. Tutup aplikasi itu, lalu coba lagi.";
        default:
          return "Kamera atau pendeteksi tangan gagal dimuat. Periksa koneksi internet, lalu coba lagi.";
      }
    };

    const resetHoldBar = () => {
      if (holdBarRef.current) {
        holdBarRef.current.style.transform = "scaleX(0)";
      }
    };

    const grabPhoto = () => {
      if (capturedRef.current) return;

      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Mirror the frame so the saved photo matches the preview.
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      capturedRef.current = true;
      setCapturedImage(canvas.toDataURL("image/jpeg", 0.92));
      setFlashKey((key) => key + 1);
      playShutter();
    };

    async function boot() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("MediaDevicesUnavailable");
        }

        setPhase("loading");
        setLoadStep("Memuat pendeteksi tangan…");

        const vision = await FilesetResolver.forVisionTasks(WASM_URL);
        if (disposed) return;

        const baseOptions = {
          modelAssetPath: MODEL_URL,
          delegate: "GPU" as const,
        };
        const commonOptions = {
          baseOptions,
          runningMode: "VIDEO" as const,
          numHands: 1,
        };

        try {
          landmarker = await HandLandmarker.createFromOptions(
            vision,
            commonOptions
          );
        } catch {
          // Machines without a usable WebGL delegate still work on CPU.
          landmarker = await HandLandmarker.createFromOptions(vision, {
            ...commonOptions,
            baseOptions: { ...baseOptions, delegate: "CPU" as const },
          });
        }

        if (disposed) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;

        setLoadStep("Menyalakan kamera…");

        stream = await navigator.mediaDevices
          .getUserMedia({
            audio: false,
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 960 },
            },
          })
          .catch(() =>
            // Some webcams reject the ideal size; retry with defaults.
            navigator.mediaDevices.getUserMedia({ audio: false, video: true })
          );

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play().catch(() => undefined);

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        setPhase("ready");
        setLoadStep("");
        detect();
      } catch (error) {
        console.error("HANDTIME init error:", error);
        fail(describeError(error));
      }
    }

    function detect() {
      if (disposed) return;

      // The timer writes its final state, and the next frame grabs the photo.
      if (statusRef.current === "done" && !capturedRef.current) {
        grabPhoto();
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const tracker = landmarkerRef.current;
      const ctx = canvas?.getContext("2d") ?? null;

      if (
        video &&
        canvas &&
        ctx &&
        tracker &&
        video.readyState >= 2 &&
        !capturedRef.current
      ) {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (width > 0 && height > 0) {
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }

          try {
            const timestamp = Math.max(
              performance.now(),
              lastTsRef.current + 1
            );
            lastTsRef.current = timestamp;

            const result = tracker.detectForVideo(video, timestamp);

            ctx.clearRect(0, 0, width, height);

            if (result.landmarks.length > 0) {
              const landmarks = result.landmarks[0];
              const reading = readHand(landmarks);

              historyRef.current.push(reading.count);
              if (historyRef.current.length > HISTORY_SIZE) {
                historyRef.current.shift();
              }
              const stable = smoothCount(historyRef.current);

              if (stable !== candidateRef.current) {
                candidateRef.current = stable;
                holdStartRef.current = performance.now();
                triggeredRef.current = false;
                setHolding(false);
              }

              setFingerCount((current) =>
                current === stable ? current : stable
              );
              setFingers((current) =>
                current.every((value, index) => value === reading.fingers[index])
                  ? current
                  : reading.fingers
              );

              drawLandmarks(ctx, landmarks, width, height);

              if (
                stable > 0 &&
                statusRef.current !== "running" &&
                statusRef.current !== "done"
              ) {
                const progress = Math.min(
                  1,
                  (performance.now() - holdStartRef.current) / HOLD_MS
                );

                if (holdBarRef.current) {
                  holdBarRef.current.style.transform = `scaleX(${progress})`;
                }

                if (progress > 0.16) {
                  setHolding(true);
                }

                if (progress >= 1 && !triggeredRef.current) {
                  triggeredRef.current = true;
                  if (startTimer(stable)) {
                    playGo();
                  }
                }
              } else {
                resetHoldBar();
              }
            } else {
              historyRef.current = [];

              if (candidateRef.current !== 0) {
                candidateRef.current = 0;
                triggeredRef.current = false;
                setFingerCount(0);
                setFingers(EMPTY_FINGERS);
                setHolding(false);
              }

              resetHoldBar();
            }
          } catch (error) {
            // A single bad frame should never kill the loop.
            console.warn("HANDTIME frame skipped:", error);
          }
        }
      }

      rafId = requestAnimationFrame(detect);
    }

    void boot();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((track) => track.stop());
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [retryKey, playGo, startTimer, playShutter]);

  const locked =
    phase !== "ready" || status === "running" || capturedImage !== null;

  const statusTone =
    phase === "error"
      ? "is-error"
      : phase === "loading"
        ? "is-loading"
        : status === "running"
          ? "is-running"
          : fingerCount > 0
            ? "is-active"
            : "is-ready";

  const statusLabel =
    phase === "error"
      ? "Kamera mati"
      : phase === "loading"
        ? "Menyiapkan kamera…"
        : status === "running"
          ? `Hitung mundur ${remaining}…`
          : capturedImage
            ? "Foto siap!"
            : fingerCount > 0
              ? holding
                ? `Tahan… ${fingerCount} jari`
                : `${fingerCount} jari terbaca`
              : "Siap. Tunjukkan jari";

  const showHint =
    phase === "ready" &&
    status === "idle" &&
    fingerCount === 0 &&
    !capturedImage;

  return (
    <>
      <main className="booth">
        <div className="booth-grid">
          <section className="stage" aria-label="Kamera">
            <div className="stage-frame" data-phase={phase}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-hidden="true"
                className="camera-video"
              />

              <canvas
                ref={canvasRef}
                className="landmark-canvas"
                aria-hidden="true"
              />

              <div className="viewfinder" aria-hidden="true" />

              {phase === "ready" && (
                <span className="rec-chip" aria-hidden="true">
                  <span className="rec-dot" />
                  live
                </span>
              )}

              {showHint && (
                <div className="stage-tip">
                  <HandWaving size={18} weight="fill" aria-hidden="true" />
                  Tunjukkan 1–5 jari
                </div>
              )}

              {phase === "loading" && (
                <div className="stage-overlay">
                  <div className="status-card">
                    <span className="status-icon">
                      <HandWaving size={34} weight="fill" aria-hidden="true" />
                    </span>
                    <h2>Menyiapkan kamera</h2>
                    <p>{loadStep || "Sebentar ya…"}</p>
                    <span className="load-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                </div>
              )}

              {phase === "error" && (
                <div className="stage-overlay">
                  <div className="status-card">
                    <span className="status-icon is-error">
                      <WarningCircle size={34} weight="fill" aria-hidden="true" />
                    </span>
                    <h2>Kamera belum bisa dipakai</h2>
                    <p>{errorMessage}</p>
                    <div className="status-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={retry}
                      >
                        Coba lagi
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {status === "running" && (
                <CountdownOverlay
                  remaining={remaining}
                  duration={duration}
                  onCancel={cancelCountdown}
                />
              )}

              {flashKey > 0 && (
                <div key={flashKey} className="flash" aria-hidden="true" />
              )}
            </div>

            <div className="stage-bottom">
              <div
                className={`status-chip ${statusTone}`}
                aria-live={status === "running" ? "off" : "polite"}
              >
                <span className="status-dot" aria-hidden="true" />
                {statusLabel}
              </div>
              <span className="stage-meta">
                <Camera size={15} weight="bold" aria-hidden="true" />
                1 tangan · 1–5 jari
              </span>
            </div>
          </section>

          <aside className="side">
            <GestureGuide
              count={fingerCount}
              fingers={fingers}
              holding={holding}
              locked={locked}
              holdBarRef={holdBarRef}
            />
            <PoseCard />
            <p className="tip-note">
              <LightbulbFilament size={18} weight="fill" aria-hidden="true" />
              Cahaya dari depan, tangan di dalam kotak, jarak satu lengan.
            </p>
          </aside>
        </div>
      </main>

      {capturedImage && (
        <PhotoResult
          image={capturedImage}
          onRetake={retake}
          onSave={savePhoto}
        />
      )}
    </>
  );
}
