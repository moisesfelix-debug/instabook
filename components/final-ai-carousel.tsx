"use client";

import { useState } from "react";

type FinalSlide = {
  id: string;
  position: number;
  headline: string | null;
  image_url: string | null;
};

export function FinalAiCarousel({
  slides,
  brandName,
}: {
  slides: FinalSlide[];
  brandName: string;
}) {
  const [index, setIndex] = useState(0);
  const current = slides[index];
  if (!current) return null;

  return (
    <article className="panel finalAiCarouselPanel">
      <div className="finalAiCarouselHead">
        <div>
          <span className="eyebrow">ARTE FINAL IA · SUNBURST</span>
          <h2>Carrossel pronto para publicar</h2>
          <p>A capa definiu a direção visual e os demais slides foram criados a partir dela.</p>
        </div>
        <div className="finalAiCarouselStatus">
          <b>{String(index + 1).padStart(2, "0")}</b>
          <span>/ {String(slides.length).padStart(2, "0")}</span>
        </div>
      </div>

      <div className="finalAiCarouselStage">
        <button
          type="button"
          className="finalAiNav finalAiNavPrev"
          onClick={() => setIndex((value) => (value - 1 + slides.length) % slides.length)}
          aria-label="Slide anterior"
        >
          ←
        </button>

        <div
          className="finalAiMainImage"
          style={current.image_url ? { backgroundImage: `url("${current.image_url}")` } : undefined}
          role="img"
          aria-label={current.headline || `Slide ${current.position} de ${brandName}`}
        >
          {!current.image_url && <span>Arte não disponível</span>}
        </div>

        <button
          type="button"
          className="finalAiNav finalAiNavNext"
          onClick={() => setIndex((value) => (value + 1) % slides.length)}
          aria-label="Próximo slide"
        >
          →
        </button>
      </div>

      <div className="finalAiThumbs" aria-label="Slides do carrossel">
        {slides.map((slide, slideIndex) => (
          <button
            type="button"
            key={slide.id}
            className={slideIndex === index ? "finalAiThumb active" : "finalAiThumb"}
            onClick={() => setIndex(slideIndex)}
            aria-label={`Abrir slide ${slide.position}`}
          >
            <span
              style={slide.image_url ? { backgroundImage: `url("${slide.image_url}")` } : undefined}
            />
            <b>{String(slide.position).padStart(2, "0")}</b>
          </button>
        ))}
      </div>

      <div className="finalAiCarouselFooter">
        <div>
          <b>{current.headline || `Slide ${current.position}`}</b>
          <small>Direção visual mantida a partir da capa aprovada.</small>
        </div>
        {current.image_url && (
          <a className="secondaryBtn" href={current.image_url} target="_blank" rel="noreferrer">
            Abrir arte
          </a>
        )}
      </div>
    </article>
  );
}
