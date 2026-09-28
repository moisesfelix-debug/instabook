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
  { id: "editorial", label: "Editorial", description: "Foto full bleed, alto contraste e título grande" },
  { id: "split", label: "Split", description: "Imagem destacada + bloco de texto com leitura rápida" },
  { id: "minimal", label: "Minimal", description: "Composição clara, elegante e respirada" },
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

async function loadBitmap(url?: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await createImageBitmap(blob);
  } catch {
    return null;
  }
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  image: ImageBitmap,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  logo: ImageBitmap | null,
  brandInitials: string,
  x: number,
  y: number,
  size: number,
  background: string,
  foreground: string
) {
  ctx.save();
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  if (logo) {
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 - 4, 0, Math.PI * 2);
    ctx.clip();
    drawCover(ctx, logo, x + 4, y + 4, size - 8, size - 8);
  } else {
    ctx.fillStyle = foreground;
    ctx.font = `900 ${Math.round(size * 0.34)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(brandInitials, x + size / 2, y + size / 2 + 1);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  ctx.restore();
}

export function VisualCarousel({
  brandName,
  primaryColor,
  secondaryColor,
  logoUrl,
  heroImageUrl,
  slides,
}: {
  brandName: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  slides: VisualSlide[];
}) {
  const [template, setTemplate] = useState<TemplateId>("editorial");
  const [index, setIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);

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

  async function drawSlide(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    const [hero, logo] = await Promise.all([
      loadBitmap(heroImageUrl),
      loadBitmap(logoUrl),
    ]);

    const headline = current.headline || "";
    const body = current.body || "";
    const number = String(current.position).padStart(2, "0");
    const total = String(slides.length).padStart(2, "0");
    const brandInitials = initials(brandName);

    ctx.textBaseline = "top";

    if (template === "editorial") {
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, width, height);

      if (hero) {
        drawCover(ctx, hero, 0, 0, width, height);
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "rgba(0,0,0,.16)");
        gradient.addColorStop(0.45, "rgba(0,0,0,.34)");
        gradient.addColorStop(1, "rgba(0,0,0,.84)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, width, 20);

      drawLogo(ctx, logo, brandInitials, 82, 74, 74, "rgba(255,255,255,.18)", "#ffffff");

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 30px Arial";
      ctx.fillText(brandName.toUpperCase(), 178, 94);

      ctx.globalAlpha = 0.12;
      ctx.font = "900 340px Arial";
      ctx.fillText(number, 735, 65);
      ctx.globalAlpha = 1;

      ctx.font = "900 82px Arial";
      const titleLines = wrapText(ctx, headline, 900, 5);
      const titleY = hero ? 650 : 410;
      titleLines.forEach((line, i) => ctx.fillText(line, 82, titleY + i * 94));

      ctx.font = "400 33px Arial";
      ctx.fillStyle = "rgba(255,255,255,.82)";
      const bodyLines = wrapText(ctx, body, 900, 5);
      const bodyStart = Math.min(1090, titleY + 38 + titleLines.length * 94);
      bodyLines.forEach((line, i) => ctx.fillText(line, 82, bodyStart + i * 45));

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 25px Arial";
      ctx.fillText(number + " / " + total, 82, 1245);
    }

    if (template === "split") {
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, width, height);

      if (hero) {
        drawCover(ctx, hero, 0, 0, width, 500);
        ctx.fillStyle = "rgba(0,0,0,.12)";
        ctx.fillRect(0, 0, width, 500);
      } else {
        ctx.fillStyle = primary;
        ctx.fillRect(0, 0, width, 500);
      }

      drawLogo(ctx, logo, brandInitials, 78, 68, 70, "rgba(255,255,255,.18)", "#ffffff");

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 28px Arial";
      ctx.fillText(brandName.toUpperCase(), 170, 88);

      ctx.fillStyle = primary;
      ctx.fillRect(76, 555, 155, 10);

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 72px Arial";
      const titleLines = wrapText(ctx, headline, 910, 5);
      titleLines.forEach((line, i) => ctx.fillText(line, 76, 620 + i * 84));

      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.font = "400 31px Arial";
      const bodyLines = wrapText(ctx, body, 910, 6);
      const bodyStart = Math.min(1090, 665 + titleLines.length * 84);
      bodyLines.forEach((line, i) => ctx.fillText(line, 76, bodyStart + i * 43));

      ctx.fillStyle = "#ffffff";
      ctx.font = "800 25px Arial";
      ctx.fillText(number + " / " + total, 76, 1245);
    }

    if (template === "minimal") {
      ctx.fillStyle = "#f8f8f5";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = primary;
      ctx.fillRect(72, 72, 12, 1206);

      drawLogo(ctx, logo, brandInitials, 130, 78, 74, primary, "#ffffff");

      ctx.fillStyle = secondary;
      ctx.font = "800 28px Arial";
      ctx.fillText(brandName.toUpperCase(), 226, 99);

      ctx.fillStyle = primary;
      ctx.font = "800 25px Arial";
      ctx.fillText(number + " / " + total, 862, 100);

      if (hero) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(520, 210, 430, 390, 34);
        ctx.clip();
        drawCover(ctx, hero, 520, 210, 430, 390);
        ctx.restore();
      }

      ctx.fillStyle = secondary;
      ctx.font = "900 72px Arial";
      const titleWidth = hero ? 365 : 820;
      const titleLines = wrapText(ctx, headline, titleWidth, hero ? 6 : 5);
      titleLines.forEach((line, i) => ctx.fillText(line, 130, 260 + i * 83));

      ctx.font = "400 31px Arial";
      ctx.fillStyle = "#626572";
      const bodyLines = wrapText(ctx, body, 820, 7);
      const bodyStart = hero ? 720 : Math.min(850, 310 + titleLines.length * 83);
      bodyLines.forEach((line, i) => ctx.fillText(line, 130, bodyStart + i * 44));
    }
  }

  async function downloadCurrentSlide() {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      await drawSlide(canvas);
      const link = document.createElement("a");
      link.download = `${brandName.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}-slide-${current.position}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  const heroStyle = heroImageUrl
    ? ({ backgroundImage: `url("${heroImageUrl}")` } as CSSProperties)
    : undefined;

  const logoStyle = logoUrl
    ? ({ backgroundImage: `url("${logoUrl}")` } as CSSProperties)
    : undefined;

  return (
    <article className="panel visualStudio" style={cssVars}>
      <div className="visualStudioHead">
        <div>
          <span className="eyebrow">ESTÚDIO VISUAL</span>
          <h2>Artes do conteúdo</h2>
          <p>Templates usam automaticamente cores, logo e imagem de apoio da marca/conteúdo.</p>
        </div>
        <button className="secondaryBtn visualDownload" type="button" onClick={downloadCurrentSlide} disabled={downloading}>
          {downloading ? "Preparando PNG..." : "Baixar slide PNG ↓"}
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

        <div className={`visualCanvas ${template} ${heroImageUrl ? "hasHero" : ""}`}>
          {heroImageUrl && <div className="visualHeroLayer" style={heroStyle} />}
          <div className="visualTop">
            <span className="visualBrandName">
              <i className={logoUrl ? "visualLogo hasImage" : "visualLogo"} style={logoStyle}>
                {!logoUrl && initials(brandName)}
              </i>
              <em>{brandName}</em>
            </span>
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
