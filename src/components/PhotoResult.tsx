import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { ArrowClockwise, DownloadSimple, Sparkle } from "@phosphor-icons/react";

type PhotoResultProps = {
  image: string;
  onRetake: () => void;
  onSave: () => void;
};

const CONFETTI_COLORS = [
  "var(--pink)",
  "var(--mint)",
  "var(--butter)",
  "var(--ink)",
];

/** Deterministic pseudo-random values keep confetti stable across re-renders. */
function seeded(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export default function PhotoResult({
  image,
  onRetake,
  onSave,
}: PhotoResultProps) {
  const retakeRef = useRef<HTMLButtonElement>(null);

  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }, (_, index) => ({
        left: seeded(index + 1) * 100,
        delay: seeded(index + 11) * 0.45,
        duration: 2.3 + seeded(index + 21) * 1.7,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        width: 6 + seeded(index + 31) * 7,
        height: 10 + seeded(index + 41) * 9,
        round: seeded(index + 51) > 0.62,
        spin: -180 + seeded(index + 61) * 360,
      })),
    []
  );

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    []
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onRetake();
    };

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    retakeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onRetake]);

  return (
    <div
      className="result"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
    >
      <div className="confetti" aria-hidden="true">
        {pieces.map((piece, index) => (
          <i
            key={index}
            style={
              {
                left: `${piece.left}%`,
                width: `${piece.width}px`,
                height: `${piece.height}px`,
                background: piece.color,
                borderRadius: piece.round ? "50%" : "2px",
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                "--spin": `${piece.spin}deg`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="result-card">
        <span className="result-tape" aria-hidden="true" />

        <div className="polaroid">
          <img src={image} alt="Hasil foto dari kamera, posisi cermin" />
        </div>

        <h2 className="result-title" id="result-title">
          <Sparkle size={22} weight="fill" aria-hidden="true" />
          Jadi deh!
        </h2>
        <p className="result-caption">handtime · {dateLabel}</p>

        <div className="result-actions">
          <button
            ref={retakeRef}
            type="button"
            className="btn btn-secondary"
            onClick={onRetake}
          >
            <ArrowClockwise size={18} weight="bold" aria-hidden="true" />
            Foto ulang
          </button>
          <button type="button" className="btn btn-primary" onClick={onSave}>
            <DownloadSimple size={18} weight="bold" aria-hidden="true" />
            Simpan foto
          </button>
        </div>
      </div>
    </div>
  );
}
