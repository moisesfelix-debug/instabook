"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

type VisualSlide = {
  id: string;
  position: number;
  headline: string | null;
  body: string | null;
};

type TemplateId = "editorial" | "split" | "minimal";

const templates: Array<{ id: TemplateId; label: string; description: string }> = [
  { id: "editorial", label: "Editorial", description: "Impacto, títulos grandes e alto contraste" },
  { id: "split", label: "Split", description: "Blocos de cor e leitura rápida" },
  { id: "minimal", label: "Minimal", description: "Mais leve, limpo e sofisticado" },
];

function safeColor(value: string | null | undefined, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? String(value) : fallback;
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? current + " " + word : word;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;

    if (lines.length === maxLines - 1) break;
  }

  if (current && lines.length < maxLines) lines.push(current);

  const consumed = lines.join(" ").split(/\s+/).filter(Boolean).length;
  if (consumed < words.length && lines.length) {
    let last = lines[lines.length - 1];
    while (last && ctx.measureText(last + "…").width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = last.trimEnd() + "…";
  }

  return lines;
}

export function VisualCarousel({
  brandName,
  primaryColor,
  secondaryColor,
  slides,
}: {
  brandName: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  slides: VisualSlide[];
}) {
  const [template, setTemplate] = useState<TemplateId>("editorial");
  const [index, setIndex] = useState(0);

  const primary = safeColor(primaryColor, "#6d4aff");
  const secondary = safeColor(secondaryColor, "#171923");
  const current = slides[index] || slides[0];

  const cssVars = useMemo(
    () =>
      ({
        "--visual-primary": primary,
        "--visual-secondary": secondary,
      }) as CSSProperties,
    [primary, secondary]
  );

  if (!current) return null;

  function drawSlide(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    const headline = current.headline || "";
    const body = current.body || "";
    const number = String(current.position).padStart(2, "0");
    const brandInitials = initials(brandName);

    ctx.textBaseline = "top";

    if (template === "editorial") {
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, width, 26);

      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 360px Arial";
      ctx.fillText(number, 700, 80);
      ctx.globalAlpha = 1;

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 31px Arial";
      ctx.fillText(brandName.toUpperCase(), 86, 86);

      ctx.font = "900 86px Arial";
      const titleLines = wrapText(ctx, headline, 900, 5);
      titleLines.forEach((line, i) => ctx.fillText(line, 86, 360 + i * 98));

      ctx.font = "400 34px Arial";
      ctx.fillStyle = "rgba(255,255,255,.82)";
      const bodyLines = wrapText(ctx, body, 900, 6);
      const bodyStart = Math.min(980, 400 + titleLines.length * 98);
      bodyLines.forEach((line, i) => ctx.fillText(line, 86, bodyStart + i * 47));

      ctx.fillStyle = "#ffffff";
      ctx.font = "700 27px Arial";
      ctx.fillText(number + " / " + String(slides.length).padStart(2, "0"), 86, 1240);
    }

    if (template === "split") {
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, width, 385);

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 30px Arial";
      ctx.fillText(brandName.toUpperCase(), 80, 70);

      ctx.font = "900 138px Arial";
      ctx.fillText(number, 80, 175);

      ctx.font = "900 76px Arial";
      const titleLines = wrapText(ctx, headline, 900, 5);
      titleLines.forEach((line, i) => ctx.fillText(line, 80, 500 + i * 88));

      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.font = "400 32px Arial";
      const bodyLines = wrapText(ctx, body, 900, 7);
      const bodyStart = Math.min(1040, 545 + titleLines.length * 88);
      bodyLines.forEach((line, i) => ctx.fillText(line, 80, bodyStart + i * 44));

      ctx.fillStyle = primary;
      ctx.fillRect(80, 1230, 170, 10);
    }

    if (template === "minimal") {
      ctx.fillStyle = "#f8f8f5";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = primary;
      ctx.fillRect(75, 75, 12, 1200);

      ctx.fillStyle = secondary;
      ctx.font = "800 28px Arial";
      ctx.fillText(brandName.toUpperCase(), 130, 95);

      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.arc(910, 125, 67, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 31px Arial";
      ctx.textAlign = "center";
      ctx.fillText(brandInitials, 910, 106);
      ctx.textAlign = "left";

      ctx.fillStyle = secondary;
      ctx.font = "900 78px Arial";
      const titleLines = wrapText(ctx, headline, 810, 5);
      titleLines.forEach((line, i) => ctx.fillText(line, 130, 355 + i * 91));

      ctx.font = "400 33px Arial";
      ctx.fillStyle = "#5f6270";
      const bodyLines = wrapText(ctx, body, 810, 7);
      const bodyStart = Math.min(1030, 405 + titleLines.length * 91);
      bodyLines.forEach((line, i) => ctx.fillText(line, 130, bodyStart + i * 45));

      ctx.fillStyle = primary;
      ctx.font = "800 27px Arial";
      ctx.fillText(number + " / " + String(slides.length).padStart(2, "0"), 130, 1215);
    }
  }

  function downloadCurrentSlide() {
    const canvas = document.createElement("canvas");
    drawSlide(canvas);
    const link = document.createElement("a");
    link.download = `${brandName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-slide-${current.position}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <article className="panel visualStudio" style={cssVars}>
      <div className="visualStudioHead">
        <div>
          <span className="eyebrow">ESTÚDIO VISUAL</span>
          <h2>Artes do conteúdo</h2>
          <p>Preview em 4:5 com identidade da marca. Exportação em 1080×1350 PNG.</p>
        </div>
        <button className="secondaryBtn visualDownload" type="button" onClick={downloadCurrentSlide}>
          Baixar slide PNG ↓
        </button>
      </div>

      <div className="templatePicker" aria-label="Escolher template visual">
        {templates.map((item) => (
          <button
            type="button"
            key={item.id}
            className={template === item.id ? "templateOption active" : "templateOption"}
            onClick={() => setTemplate(item.id)}
          >
            <b>{item.label}</b>
            <small>{item.description}</small>
          </button>
        ))}
      </div>

      <div className="visualWorkspace">
        <button
          className="visualNav"
          type="button"
          onClick={() => setIndex((value) => (value - 1 + slides.length) % slides.length)}
          aria-label="Slide anterior"
        >
          ←
        </button>

        <div className={`visualCanvas ${template}`}>
          <div className="visualTop">
            <span>{brandName}</span>
            <b>{String(current.position).padStart(2, "0")}</b>
          </div>
          <div className="visualCopy">
            <h3>{current.headline}</h3>
            {current.body && <p>{current.body}</p>}
          </div>
          <div className="visualFooter">
            <span>{initials(brandName)}</span>
            <small>{String(current.position).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</small>
          </div>
        </div>

        <button
          className="visualNav"
          type="button"
          onClick={() => setIndex((value) => (value + 1) % slides.length)}
          aria-label="Próximo slide"
        >
          →
        </button>
      </div>

      <div className="visualThumbs">
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            className={slideIndex === index ? "visualThumb active" : "visualThumb"}
            onClick={() => setIndex(slideIndex)}
            aria-label={`Abrir slide ${slide.position}`}
          >
            {String(slide.position).padStart(2, "0")}
          </button>
        ))}
      </div>
    </article>
  );
}
