import { useState } from "react";
import { DiceFive, Sparkle } from "@phosphor-icons/react";

const POSES = [
  "Tangan di pipi, senyum manis.",
  "Peace sign tepat di depan mata.",
  "Jari di dagu, gaya sedang mikir.",
  "Dua tangan di kepala, gaya kelinci.",
  "Acungkan jempol, mata setengah sipit.",
  "Tunjuk lima jari, mulut mangap lebar.",
  "Tangan menyilang di dada, gaya formal.",
  "Jari menyamping di dekat pelipis.",
  "Satu jari di depan mulut, gaya rahasia.",
  "Tangan melambai ke kamera, senyum lebar.",
];

export default function PoseCard() {
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * POSES.length)
  );

  const shuffle = () => {
    setIndex((current) => {
      let next = current;
      while (next === current && POSES.length > 1) {
        next = Math.floor(Math.random() * POSES.length);
      }
      return next;
    });
  };

  return (
    <section className="panel pose-card" aria-labelledby="pose-title">
      <div className="panel-head">
        <h2 className="panel-title" id="pose-title">
          <Sparkle size={20} weight="fill" aria-hidden="true" />
          Ide pose
        </h2>
        <button type="button" className="chip-btn" onClick={shuffle}>
          <DiceFive size={16} weight="bold" aria-hidden="true" />
          Acak
        </button>
      </div>

      <p className="pose-text" aria-live="polite">
        {POSES[index]}
      </p>
      <p className="pose-sub">Ganti pose sebelum hitung mundur mulai.</p>
    </section>
  );
}
