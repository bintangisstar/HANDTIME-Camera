import {
  Camera,
  HandWaving,
  Smiley,
  Sparkle,
} from "@phosphor-icons/react";

type StartScreenProps = {
  onStart: () => void;
};

const STEPS = [
  {
    title: "Angkat jari",
    body: "Jumlah jari jadi detik timer.",
    tone: "butter",
    icon: HandWaving,
  },
  {
    title: "Tahan sebentar",
    body: "Tahan sampai hitung mundur mulai.",
    tone: "mint",
    icon: Sparkle,
  },
  {
    title: "Senyum!",
    body: "Kami jepret otomatis.",
    tone: "pink",
    icon: Camera,
  },
] as const;

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <main className="start">
      <section className="start-hero">
        <div className="start-copy">
          <span className="tag-pill">
            <Sparkle size={14} weight="fill" aria-hidden="true" />
            Timer foto dari jari
          </span>

          <h1 className="hero-title">
            Tunjuk jari.
            <br />
            Kami hitung.
            <br />
            <span className="mark">Kamu senyum.</span>
          </h1>

          <p className="hero-sub">
            Angkat 1–5 jari dan tahan sebentar. Jumlah jarimu menentukan timer,
            lalu foto siap disimpan.
          </p>

          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onStart}>
              <Camera size={20} weight="fill" aria-hidden="true" />
              Nyalakan kamera
            </button>
          </div>
        </div>

        <div className="start-art" aria-hidden="true">
          <span className="art-halo" />
          <span className="art-ring" />

          <div className="art-card">
            <Smiley size={34} weight="fill" className="art-smiley" />
            <HandWaving size={148} weight="fill" className="art-hand" />
            <span className="art-shadow" />
          </div>

          <span className="float-tag tag-a">3</span>
          <span className="float-tag tag-b">2</span>
          <span className="float-tag tag-c">1</span>
        </div>
      </section>

      <ol className="steps" aria-label="Cara pakai">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <li className="step" key={step.title}>
              <span className={`step-num tone-${step.tone}`} aria-hidden="true">
                <Icon size={18} weight="fill" />
              </span>
              <div className="step-copy">
                <h2>
                  <span className="step-index">{index + 1}.</span> {step.title}
                </h2>
                <p>{step.body}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="start-foot">
        Deteksi tangan berjalan lokal lewat MediaPipe. Foto tidak dikirim ke
        server mana pun.
      </p>
    </main>
  );
}
