import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

export function countFingers(landmarks: NormalizedLandmark[]): number {
  let count = 0;

  // Deteksi 4 jari utama
  const tips = [8, 12, 16, 20];
  const pips = [6, 10, 14, 18];

  for (let i = 0; i < 4; i++) {
    if (landmarks[tips[i]].y < landmarks[pips[i]].y) {
      count++;
    }
  }

  // Deteksi ibu jari
  if (landmarks[4].x < landmarks[3].x) {
    count++;
  }

  return count;
}