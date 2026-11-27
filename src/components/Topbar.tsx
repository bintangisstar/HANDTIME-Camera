import {
  HandWaving,
  LockSimple,
  SpeakerHigh,
  SpeakerSlash,
} from "@phosphor-icons/react";

type TopbarProps = {
  onBrandClick?: () => void;
  sound?: { on: boolean; onToggle: () => void };
};

export default function Topbar({ onBrandClick, sound }: TopbarProps) {
  const brandInner = (
    <>
      <span className="brand-mark">
        <HandWaving size={22} weight="fill" aria-hidden="true" />
      </span>
      <span className="brand-name">
        handtime
        <span className="brand-dot" aria-hidden="true" />
      </span>
    </>
  );

  return (
    <header className="topbar">
      {onBrandClick ? (
        <button
          type="button"
          className="brand"
          onClick={onBrandClick}
          aria-label="Kembali ke halaman awal"
        >
          {brandInner}
        </button>
      ) : (
        <div className="brand">{brandInner}</div>
      )}

      <div className="topbar-right">
        {sound ? (
          <button
            type="button"
            className="icon-btn"
            onClick={sound.onToggle}
            aria-pressed={sound.on}
            aria-label={sound.on ? "Matikan suara" : "Nyalakan suara"}
            title={sound.on ? "Matikan suara" : "Nyalakan suara"}
          >
            {sound.on ? (
              <SpeakerHigh size={20} weight="bold" />
            ) : (
              <SpeakerSlash size={20} weight="bold" />
            )}
          </button>
        ) : (
          <span className="trust-chip">
            <LockSimple size={14} weight="bold" aria-hidden="true" />
            Jalan di browser kamu
          </span>
        )}
      </div>
    </header>
  );
}
