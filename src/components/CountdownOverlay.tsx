type CountdownOverlayProps = {
  remaining: number;
  duration: number;
  onCancel: () => void;
};

export default function CountdownOverlay({
  remaining,
  duration,
  onCancel,
}: CountdownOverlayProps) {
  const isLast = remaining <= 1;

  return (
    <div className="countdown" role="group" aria-label="Hitung mundur foto">
      <div className="countdown-inner">
        <svg className="countdown-ring" viewBox="0 0 120 120">
          <circle className="ring-track" cx="60" cy="60" r="54" pathLength={100} />
          <circle
            key={duration}
            className="ring-bar"
            cx="60"
            cy="60"
            r="54"
            pathLength={100}
            style={{ animationDuration: `${duration}s` }}
          />
        </svg>
        <span className="countdown-num" key={remaining} aria-live="off">
          {remaining > 0 ? remaining : "0"}
        </span>
      </div>
      <span className={`countdown-label ${isLast ? "is-last" : ""}`}>
        {isLast ? "Senyum!" : "Siap-siap…"}
      </span>
      <button type="button" className="countdown-cancel" onClick={onCancel}>
        Batal
      </button>
    </div>
  );
}
