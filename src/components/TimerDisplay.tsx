type TimerDisplayProps = {
  status: "READY" | "RUNNING" | "COMPLETED";
  duration: number;
  remaining: number;
  gesture: number;
  onReset: () => void;
};

export default function TimerDisplay({
  status,
  duration,
  remaining,
  gesture,
  onReset,
}: TimerDisplayProps) {
  const progress =
    duration > 0 ? ((duration - remaining) / duration) * 100 : 0;

  return (
    <div className="timer-card">
      <div className="timer-status">
        <span className={`status-dot ${status.toLowerCase()}`} />
        {status}
      </div>

      <div className="timer-number">
        {status === "READY" ? "--" : remaining}
      </div>

      <div className="timer-label">
        {status === "READY" && "WAITING FOR GESTURE"}
        {status === "RUNNING" && `${gesture} FINGER DETECTED`}
        {status === "COMPLETED" && "TIMER COMPLETED"}
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button className="reset-button" onClick={onReset}>
        RESET TIMER
      </button>
    </div>
  );
}