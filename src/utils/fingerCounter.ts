import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export type FingerState = [boolean, boolean, boolean, boolean, boolean];

export type HandReading = {
  /** 0 = fist, 5 = open palm. */
  count: number;
  /** [thumb, index, middle, ring, pinky] */
  fingers: FingerState;
};

const OTHER_FINGERS = [
  { tip: 8, pip: 6 }, // index
  { tip: 12, pip: 10 }, // middle
  { tip: 16, pip: 14 }, // ring
  { tip: 20, pip: 18 }, // pinky
] as const;

function distance(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Counts extended fingers from a MediaPipe hand landmark set.
 *
 * Uses distance-to-wrist instead of tip.y < pip.y, so a tilted or sideways
 * hand is read correctly. The thumb compares its tip/IP joints against both
 * the index and pinky knuckles, which stays reliable without relying on the
 * reported handedness (the preview is mirrored).
 */
export function readHand(landmarks: NormalizedLandmark[]): HandReading {
  if (landmarks.length < 21) {
    return { count: 0, fingers: [false, false, false, false, false] };
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  const indexMcp = landmarks[5];
  const pinkyMcp = landmarks[17];

  const thumbExtended =
    distance(thumbTip, indexMcp) > distance(thumbIp, indexMcp) * 1.06 &&
    distance(thumbTip, pinkyMcp) > distance(thumbIp, pinkyMcp) * 1.06 &&
    distance(thumbTip, wrist) > distance(thumbIp, wrist) * 1.02;

  const fingers: FingerState = [thumbExtended, false, false, false, false];

  OTHER_FINGERS.forEach(({ tip, pip }, index) => {
    fingers[index + 1] =
      distance(landmarks[tip], wrist) > distance(landmarks[pip], wrist) * 1.08;
  });

  return {
    count: fingers.reduce((total, up) => (up ? total + 1 : total), 0),
    fingers,
  };
}

/** Majority vote over recent frames, to stop a single shaky frame from flickering. */
export function smoothCount(history: number[]): number {
  if (history.length === 0) return 0;

  const tally = new Map<number, number>();
  for (const value of history) {
    tally.set(value, (tally.get(value) ?? 0) + 1);
  }

  let best = 0;
  let bestVotes = -1;
  for (const [value, votes] of tally) {
    if (votes > bestVotes || (votes === bestVotes && value > best)) {
      best = value;
      bestVotes = votes;
    }
  }
  return best;
}
