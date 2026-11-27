import type { RefObject } from "react";
import { HandPalm } from "@phosphor-icons/react";
import type { FingerState } from "../utils/fingerCounter";

type GestureGuideProps = {
  count: number;
  fingers: FingerState;
  holding: boolean;
  locked: boolean;
  holdBarRef: RefObject<HTMLDivElement | null>;
};

const FINGER_LABELS = ["Ibu jari", "Telunjuk", "Tengah", "Manis", "Kelingking"];
const FINGER_HEIGHTS = [30, 44, 50, 44, 34];

export default function GestureGuide({
  count,
  fingers,
  holding,
  locked,
  holdBarRef,
}: GestureGuideProps) {
  return (
    <section className="panel guide-card" aria-labelledby="guide-title">
      <div className="panel-head">
        <h2 className="panel-title" id="guide-title">
          <HandPalm size={20} weight="fill" aria-hidden="true" />
          Baca jari
        </h2>
        <span className={`live-badge ${locked ? "is-locked" : ""}`}>
          <span className="live-dot" aria-hidden="true" />
          {locked ? "tunggu" : "live"}
        </span>
      </div>

      <div className="read-row">
        <span className="read-count">
          {count}
          <span className="read-max">/5</span>
        </span>
        <div className="finger-row" aria-hidden="true">
          {fingers.map((up, index) => (
            <span
              key={FINGER_LABELS[index]}
              className={`finger ${up ? "is-up" : ""}`}
              style={{ height: `${FINGER_HEIGHTS[index]}px` }}
            />
          ))}
        </div>
        <span className="sr-only" aria-live="polite">
          {count} jari terdeteksi
        </span>
      </div>

      <div className="hold-block">
        <div className="hold-labels">
          <span>
            {locked
              ? "Hitung mundur jalan"
              : holding
                ? "Tahan… sebentar lagi"
                : "Tahan untuk mulai"}
          </span>
          <span className="hold-time">{locked ? "—" : "0,6 dtk"}</span>
        </div>
        <div className="hold-track">
          <div className="hold-fill" ref={holdBarRef} />
        </div>
      </div>

      <p className="guide-hint">
        {count === 0
          ? "Angkat 1–5 jari di dalam kotak kamera."
          : `Terbaca ${count} jari. Tahan posisinya biar timer mulai.`}
      </p>
    </section>
  );
}
