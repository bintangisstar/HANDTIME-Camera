import { useGestureTimer } from "../hooks/useGestureTimer";
import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

import { countFingers } from "../utils/fingerCounter";
import TimerDisplay from "./TimerDisplay";

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);

  const [fingerCount, setFingerCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const {
    status,
    duration,
    remaining,
    startTimer,
    resetTimer,
  } = useGestureTimer();

  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const [stableGesture, setStableGesture] = useState(0);

  const gestureCandidateRef = useRef(0);
  const gestureStartRef = useRef(0);
  const triggeredRef = useRef(false);
  const capturedRef = useRef(false);

  // TAKE PHOTO
  const capturePhoto = () => {
    const video = videoRef.current;

    if (!video || video.videoWidth === 0) return;

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Mirror foto agar sesuai preview kamera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = canvas.toDataURL("image/png");

    setCapturedImage(image);
    capturedRef.current = true;
  };

  // AUTO CAPTURE WHEN TIMER COMPLETED
  useEffect(() => {
    if (status === "COMPLETED" && !capturedRef.current) {
      capturePhoto();
    }
  }, [status]);

  // RETAKE
  const retakePhoto = () => {
    setCapturedImage(null);
    capturedRef.current = false;

    triggeredRef.current = false;
    gestureCandidateRef.current = 0;
    gestureStartRef.current = performance.now();

    resetTimer();
  };

  // SAVE PHOTO
  const savePhoto = () => {
    if (!capturedImage) return;

    const link = document.createElement("a");

    link.href = capturedImage;
    link.download = `handtime-${Date.now()}.png`;

    link.click();
  };

  // CAMERA & HAND DETECTION
  useEffect(() => {
    let animationId: number;
    let stream: MediaStream;
    let disposed = false;

    async function setup() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      if (disposed) return;

      landmarkerRef.current = await HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        }
      );

      if (disposed) {
        landmarkerRef.current?.close();
        landmarkerRef.current = null;
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
        },
      });

      if (disposed) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        if (disposed) return;

        setCameraActive(true);
      }

      detect();
    }

    function detect() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (!video || !canvas || !ctx || !landmarkerRef.current) {
        animationId = requestAnimationFrame(detect);
        return;
      }

      if (video.readyState >= 2) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const result = landmarkerRef.current.detectForVideo(
          video,
          performance.now()
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (result.landmarks.length > 0) {
          const landmarks = result.landmarks[0];

          const fingers = countFingers(landmarks);

          setFingerCount(fingers);

          if (fingers !== gestureCandidateRef.current) {
            gestureCandidateRef.current = fingers;
            gestureStartRef.current = performance.now();
            triggeredRef.current = false;
          }

          const elapsed =
            performance.now() - gestureStartRef.current;

          if (
            fingers > 0 &&
            elapsed >= 500 &&
            !triggeredRef.current &&
            statusRef.current !== "RUNNING" &&
            statusRef.current !== "COMPLETED" &&
            !capturedRef.current
          ) {
            triggeredRef.current = true;
            setStableGesture(fingers);
            startTimer(fingers);
          }

          // DRAW LANDMARKS
          for (const point of landmarks) {
            ctx.beginPath();

            ctx.arc(
              point.x * canvas.width,
              point.y * canvas.height,
              5,
              0,
              2 * Math.PI
            );

            ctx.fillStyle = "#B6F542";
            ctx.fill();
          }
        } else {
          setFingerCount(0);

          gestureCandidateRef.current = 0;
          gestureStartRef.current = performance.now();
          triggeredRef.current = false;
        }
      }

      animationId = requestAnimationFrame(detect);
    }

    setup().catch((error) => {
      if (!disposed) {
        console.error("Camera error:", error);
      }
    });

    return () => {
      disposed = true;

      cancelAnimationFrame(animationId);

      stream?.getTracks().forEach((track) => track.stop());

      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, []);

  // UI
  return (
    <div className="handtime-container">
      <h1 className="handtime-title">HANDTIME</h1>

      <div className="camera-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-video"
        />

        <canvas
          ref={canvasRef}
          className="landmark-canvas"
        />

        {!cameraActive && (
          <div className="camera-loading">
            INITIALIZING CAMERA...
          </div>
        )}
      </div>

      <div className="finger-counter">
        FINGER COUNT: <span>{fingerCount}</span>
      </div>

      <TimerDisplay
        status={status}
        duration={duration}
        remaining={remaining}
        gesture={stableGesture}
        onReset={retakePhoto}
      />

      {capturedImage && (
        <div className="capture-preview">
          <h2>PHOTO CAPTURED!</h2>

          <img
            src={capturedImage}
            alt="Captured photo"
            className="captured-photo"
          />

          <div className="capture-actions">
            <button onClick={retakePhoto}>
              RETAKE
            </button>

            <button onClick={savePhoto}>
              SAVE PHOTO
            </button>
          </div>
        </div>
      )}
    </div>
  );
}