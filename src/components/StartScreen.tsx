import {
  Camera,
  Check,
  HandWaving,
  LockSimple,
  Sparkle,
} from "@phosphor-icons/react";
import { BOOTH_TEMPLATES } from "../utils/boothTemplates";

type StartScreenProps = {
  onStart: () => void;
  templateId: string;
  onTemplateChange: (templateId: string) => void;
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

export default function StartScreen({ onStart, templateId, onTemplateChange }: StartScreenProps) {
  const selectedTemplate = BOOTH_TEMPLATES.find((template) => template.id === templateId) ?? BOOTH_TEMPLATES[0];

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
            Photobooth tanpa timer ribet. Angkat jari untuk mengatur hitung mundur, lalu biarkan kamera bekerja.
          </p>

          <section className="template-picker" aria-labelledby="template-heading">
            <div className="template-picker-heading">
              <div>
                <h2 id="template-heading">Pilih gaya frame</h2>
                <p className="template-helper">Bisa diganti kapan saja sebelum mulai</p>
              </div>
              <span className="template-count">{BOOTH_TEMPLATES.find((item) => item.id === templateId)?.slots.length} jepretan</span>
            </div>
            <div className="template-options" role="group" aria-labelledby="template-heading">
              {BOOTH_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`template-option${templateId === template.id ? " is-selected" : ""}`}
                  onClick={() => onTemplateChange(template.id)}
                  aria-pressed={templateId === template.id}
                >
                  <img src={template.image} alt="" />
                  <span className="template-option-meta">
                    <span>{template.name}</span>
                    {templateId === template.id && <Check size={16} weight="bold" aria-label="Dipilih" />}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onStart}>
              <Camera size={20} weight="fill" aria-hidden="true" />
              Nyalakan kamera
            </button>
          </div>
        </div>

        <figure className="start-art" aria-label={`Preview frame ${selectedTemplate.name}`}>
          <Sparkle className="preview-spark preview-spark-one" size={27} weight="fill" aria-hidden="true" />
          <Sparkle className="preview-spark preview-spark-two" size={19} weight="fill" aria-hidden="true" />
          <div className="preview-frame">
            <img key={selectedTemplate.id} src={selectedTemplate.image} alt={`Contoh desain frame ${selectedTemplate.name}`} />
          </div>
          <figcaption className="preview-caption">
            <span className="preview-caption-icon"><Camera size={17} weight="fill" aria-hidden="true" /></span>
            <span><strong>{selectedTemplate.name}</strong><small>Frame pilihanmu</small></span>
            <span className="preview-shot-count">{selectedTemplate.slots.length} foto</span>
          </figcaption>
        </figure>
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
        <LockSimple size={16} weight="fill" aria-hidden="true" />
        Kamera dan foto diproses di perangkatmu. Tidak ada foto yang diunggah.
      </p>
    </main>
  );
}
