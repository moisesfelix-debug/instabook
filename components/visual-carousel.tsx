"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

type Archetype = "general" | "checklist" | "story" | "comparison" | "product" | "authority";
type ArtDirection = "editorial" | "split" | "minimal";
type SlideRole = "hook" | "second_hook" | "context" | "item" | "comparison" | "proof" | "transition" | "result" | "takeaway" | "cta" | "body";

type VisualSlide = {
  id: string;
  position: number;
  headline: string | null;
  body: string | null;
  slide_role?: SlideRole | null;
  emphasis?: "high" | "medium" | "low" | null;
  visual_priority?: "text" | "image" | "balanced" | null;
  badge?: string | null;
  highlight?: string | null;
  secondary_headline?: string | null;
  secondary_body?: string | null;
  image_url?: string | null;
};

const directions: Array<{ id: ArtDirection; label: string; description: string }> = [
  { id: "editorial", label: "Editorial", description: "Narrativa forte, tipografia dominante e ritmo de revista" },
  { id: "split", label: "Split", description: "Contraste, blocos, comparações e fotografia em destaque" },
  { id: "minimal", label: "Minimal", description: "Dados, autoridade, sofisticação e bastante respiro" },
];

const archetypeLabels: Record<Archetype, string> = {
  general: "Conteúdo editorial",
  checklist: "Checklist / Lista",
  story: "Story / Case",
  comparison: "Comparação",
  product: "Produto / Foto-led",
  authority: "Dados / Autoridade",
};

const roleLabels: Record<SlideRole, string> = {
  hook: "HOOK",
  second_hook: "2º HOOK",
  context: "CONTEXTO",
  item: "ITEM",
  comparison: "COMPARAÇÃO",
  proof: "PROVA",
  transition: "VIRADA",
  result: "RESULTADO",
  takeaway: "INSIGHT",
  cta: "CTA",
  body: "CONTEÚDO",
};

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

function fallbackRole(archetype: Archetype, position: number, total: number): SlideRole {
  if (position === 1) return "hook";
  if (position === total) return "cta";
  if (archetype === "checklist") return position === 2 ? "second_hook" : "item";
  if (archetype === "comparison") return position === 2 ? "second_hook" : "comparison";
  if (archetype === "story") {
    if (position === 2) return "context";
    if (position === 4) return "transition";
    if (position === 5) return "result";
    if (position === 6) return "takeaway";
  }
  if (archetype === "authority") return position === 2 ? "context" : position >= total - 1 ? "takeaway" : "proof";
  if (archetype === "product") return position === 2 ? "context" : position === total - 1 ? "proof" : "item";
  return position === 2 ? "context" : "body";
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
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
    while (last && ctx.measureText(last + "…").width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = last.trimEnd() + "…";
  }

  return lines;
}

function fillWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const lines = wrapText(ctx, text, maxWidth, maxLines);
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return lines.length;
}

async function loadBitmap(url?: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await createImageBitmap(await response.blob());
  } catch {
    return null;
  }
}

function drawCover(ctx: CanvasRenderingContext2D, image: ImageBitmap, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(
    image,
    (image.width - sourceWidth) / 2,
    (image.height - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    x,
    y,
    width,
    height
  );
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

function drawPill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, background: string, foreground: string) {
  ctx.font = "800 24px Arial";
  const width = Math.min(350, ctx.measureText(text).width + 42);
  ctx.fillStyle = background;
  ctx.beginPath();
  ctx.roundRect(x, y, width, 52, 26);
  ctx.fill();
  ctx.fillStyle = foreground;
  ctx.fillText(text, x + 21, y + 13);
}

export function VisualCarousel({
  brandName,
  primaryColor,
  secondaryColor,
  logoUrl,
  heroImageUrl,
  contentArchetype = "general",
  artDirection = "editorial",
  slides,
}: {
  brandName: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  heroImageUrl?: string | null;
  contentArchetype?: Archetype | null;
  artDirection?: ArtDirection | null;
  slides: VisualSlide[];
}) {
  const archetype: Archetype = contentArchetype || "general";
  const initialDirection: ArtDirection = directions.some((item) => item.id === artDirection)
    ? (artDirection as ArtDirection)
    : "editorial";

  const [direction, setDirection] = useState<ArtDirection>(initialDirection);
  const [index, setIndex] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const primary = safeColor(primaryColor, "#6d4aff");
  const secondary = safeColor(secondaryColor, "#171923");
  const current = slides[index] || slides[0];
  const role = current
    ? current.slide_role || fallbackRole(archetype, current.position, slides.length)
    : "body";

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

    canvas.width = 1080;
    canvas.height = 1350;

    const activeImageUrl = current.image_url || heroImageUrl;
    const [hero, logo] = await Promise.all([loadBitmap(activeImageUrl), loadBitmap(logoUrl)]);
    const headline = current.headline || "";
    const body = current.body || "";
    const slideRole = current.slide_role || fallbackRole(archetype, current.position, slides.length);
    const number = String(current.position).padStart(2, "0");
    const total = String(slides.length).padStart(2, "0");
    const brandInitials = initials(brandName);
    const badge = current.badge || roleLabels[slideRole];

    ctx.textBaseline = "top";

    // Base art direction.
    if (direction === "editorial") {
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, 1080, 1350);
      if (hero && (current.visual_priority === "image" || current.visual_priority === "balanced" || slideRole === "hook")) {
        drawCover(ctx, hero, 0, 0, 1080, 1350);
        const gradient = ctx.createLinearGradient(0, 0, 0, 1350);
        gradient.addColorStop(0, "rgba(7,7,12,.15)");
        gradient.addColorStop(.45, "rgba(7,7,12,.38)");
        gradient.addColorStop(1, "rgba(7,7,12,.9)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1350);
      }
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, 1080, 18);
    } else if (direction === "split") {
      ctx.fillStyle = secondary;
      ctx.fillRect(0, 0, 1080, 1350);
      ctx.fillStyle = primary;
      ctx.fillRect(0, 0, 1080, slideRole === "comparison" ? 180 : 430);
      if (hero && current.visual_priority !== "text" && slideRole !== "comparison") {
        drawCover(ctx, hero, 0, 0, 1080, 430);
        ctx.fillStyle = "rgba(0,0,0,.18)";
        ctx.fillRect(0, 0, 1080, 430);
      }
    } else {
      ctx.fillStyle = "#f8f8f5";
      ctx.fillRect(0, 0, 1080, 1350);
      ctx.fillStyle = primary;
      ctx.fillRect(72, 72, 12, 1206);
      if (hero && current.visual_priority === "image") {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(500, 205, 455, 385, 30);
        ctx.clip();
        drawCover(ctx, hero, 500, 205, 455, 385);
        ctx.restore();
      }
    }

    const light = direction !== "minimal";
    const mainText = light ? "#ffffff" : secondary;
    const softText = light ? "rgba(255,255,255,.76)" : "#636674";
    const pillBg = light ? "rgba(255,255,255,.16)" : primary;
    const pillText = "#ffffff";

    drawLogo(ctx, logo, brandInitials, 78, 68, 68, pillBg, pillText);
    ctx.fillStyle = mainText;
    ctx.font = "800 28px Arial";
    ctx.fillText(brandName.toUpperCase(), 166, 88);
    drawPill(ctx, badge.toUpperCase(), 78, 170, pillBg, pillText);

    ctx.fillStyle = light ? "rgba(255,255,255,.16)" : primary;
    ctx.font = "900 160px Arial";
    ctx.fillText(number, 825, 55);

    // Role-aware composition.
    if (slideRole === "hook" || slideRole === "second_hook") {
      ctx.fillStyle = mainText;
      ctx.font = "900 88px Arial";
      const y = direction === "split" ? 555 : hero && direction === "editorial" ? 650 : 430;
      const lines = fillWrapped(ctx, headline, 78, y, 920, 98, 5);
      if (body) {
        ctx.fillStyle = softText;
        ctx.font = "400 32px Arial";
        fillWrapped(ctx, body, 78, y + lines * 98 + 28, 900, 45, 4);
      }
    } else if (slideRole === "item") {
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.arc(160, 585, 78, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "900 58px Arial";
      ctx.fillText(number, 160, 552);
      ctx.textAlign = "left";

      ctx.fillStyle = mainText;
      ctx.font = "900 66px Arial";
      const lines = fillWrapped(ctx, headline, 280, 500, 690, 77, 4);
      ctx.fillStyle = softText;
      ctx.font = "400 31px Arial";
      fillWrapped(ctx, body, 280, 520 + lines * 77, 690, 43, 6);
    } else if (slideRole === "comparison") {
      const leftTitle = headline || "Antes";
      const rightTitle = current.secondary_headline || current.highlight || "Depois";
      const leftBody = body || "";
      const rightBody = current.secondary_body || "";

      const top = 410;
      ctx.fillStyle = direction === "minimal" ? "#ffffff" : "rgba(255,255,255,.09)";
      ctx.beginPath(); ctx.roundRect(70, top, 445, 650, 30); ctx.fill();
      ctx.beginPath(); ctx.roundRect(565, top, 445, 650, 30); ctx.fill();

      ctx.fillStyle = light ? "#ffb9bf" : "#a24650";
      ctx.font = "900 26px Arial";
      ctx.fillText("ANTES / ERRADO", 105, top + 45);
      ctx.fillStyle = mainText;
      ctx.font = "900 52px Arial";
      const l = fillWrapped(ctx, leftTitle, 105, top + 105, 365, 62, 4);
      ctx.fillStyle = softText;
      ctx.font = "400 28px Arial";
      fillWrapped(ctx, leftBody, 105, top + 135 + l * 62, 365, 39, 7);

      ctx.fillStyle = direction === "minimal" ? primary : "#a8f0d3";
      ctx.font = "900 26px Arial";
      ctx.fillText("DEPOIS / CERTO", 600, top + 45);
      ctx.fillStyle = mainText;
      ctx.font = "900 52px Arial";
      const r = fillWrapped(ctx, rightTitle, 600, top + 105, 365, 62, 4);
      ctx.fillStyle = softText;
      ctx.font = "400 28px Arial";
      fillWrapped(ctx, rightBody, 600, top + 135 + r * 62, 365, 39, 7);
    } else if (slideRole === "proof" || slideRole === "result") {
      if (current.highlight) {
        ctx.fillStyle = direction === "minimal" ? primary : "#ffffff";
        ctx.font = "900 112px Arial";
        fillWrapped(ctx, current.highlight, 78, 420, 900, 120, 2);
      }
      ctx.fillStyle = mainText;
      ctx.font = "900 64px Arial";
      const y = current.highlight ? 680 : 470;
      const lines = fillWrapped(ctx, headline, 78, y, 900, 75, 4);
      ctx.fillStyle = softText;
      ctx.font = "400 31px Arial";
      fillWrapped(ctx, body, 78, y + lines * 75 + 25, 900, 43, 6);
    } else if (slideRole === "cta") {
      ctx.fillStyle = mainText;
      ctx.font = "900 82px Arial";
      const lines = fillWrapped(ctx, headline, 78, 470, 900, 94, 4);
      ctx.fillStyle = softText;
      ctx.font = "400 32px Arial";
      fillWrapped(ctx, body, 78, 500 + lines * 94, 860, 45, 5);
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.roundRect(78, 1050, 490, 92, 46);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 30px Arial";
      ctx.fillText("CONTINUE / SALVE / COMPARTILHE →", 112, 1080);
    } else {
      if (current.highlight) {
        ctx.fillStyle = direction === "minimal" ? primary : "rgba(255,255,255,.92)";
        ctx.font = "900 76px Arial";
        fillWrapped(ctx, current.highlight, 78, 405, 850, 88, 2);
      }
      ctx.fillStyle = mainText;
      ctx.font = "900 64px Arial";
      const start = current.highlight ? 650 : 465;
      const lines = fillWrapped(ctx, headline, 78, start, 900, 75, 4);
      ctx.fillStyle = softText;
      ctx.font = "400 31px Arial";
      fillWrapped(ctx, body, 78, start + lines * 75 + 24, 900, 43, 7);
    }

    ctx.fillStyle = light ? "rgba(255,255,255,.85)" : primary;
    ctx.font = "800 24px Arial";
    ctx.fillText(number + " / " + total, 78, 1245);
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

  const activeImageUrl = current.image_url || heroImageUrl;
  const heroStyle = activeImageUrl ? ({ backgroundImage: `url("${activeImageUrl}")` } as CSSProperties) : undefined;
  const logoStyle = logoUrl ? ({ backgroundImage: `url("${logoUrl}")` } as CSSProperties) : undefined;
  const displayRole = current.slide_role || fallbackRole(archetype, current.position, slides.length);

  return (
    <article className="panel visualStudio professionalStudio" style={cssVars}>
      <div className="visualStudioHead">
        <div>
          <span className="eyebrow">DIREÇÃO CRIATIVA</span>
          <div className="creativeTitleRow">
            <h2>{archetypeLabels[archetype]}</h2>
            <span className="archetypeBadge">{roleLabels[displayRole]}</span>
          </div>
          <p>O layout muda conforme a função do slide. Direção recomendada pela IA: <b>{artDirection || "editorial"}</b>.</p>
        </div>
        <button className="secondaryBtn visualDownload" type="button" onClick={downloadCurrentSlide} disabled={downloading}>
          {downloading ? "Preparando PNG..." : "Baixar slide PNG ↓"}
        </button>
      </div>

      <div className="templatePicker directionPicker" aria-label="Escolher direção de arte">
        {directions.map((item) => (
          <button
            type="button"
            key={item.id}
            className={direction === item.id ? "templateOption active" : "templateOption"}
            onClick={() => setDirection(item.id)}
          >
            <b>{item.label}</b>
            <small>{item.description}</small>
          </button>
        ))}
      </div>

      <div className="visualWorkspace">
        <button className="visualNav" type="button" onClick={() => setIndex((v) => (v - 1 + slides.length) % slides.length)} aria-label="Slide anterior">←</button>

        <div className={`visualCanvas proCanvas ${direction} role-${displayRole} priority-${current.visual_priority || "balanced"} ${activeImageUrl ? "hasHero" : ""}`}>
          {activeImageUrl && current.visual_priority !== "text" && <div className="visualHeroLayer" style={heroStyle} />}
          {current.image_url && <span className="aiVisualChip">VISUAL IA</span>}

          <div className="visualTop">
            <span className="visualBrandName">
              <i className={logoUrl ? "visualLogo hasImage" : "visualLogo"} style={logoStyle}>{!logoUrl && initials(brandName)}</i>
              <em>{brandName}</em>
            </span>
            <span className="roleChip">{current.badge || roleLabels[displayRole]}</span>
          </div>

          {displayRole === "comparison" ? (
            <div className="comparisonPreview">
              <div className="compareSide bad">
                <small>ANTES / ERRADO</small>
                <h3>{current.headline}</h3>
                <p>{current.body}</p>
              </div>
              <div className="compareSide good">
                <small>DEPOIS / CERTO</small>
                <h3>{current.secondary_headline || current.highlight || "Melhor caminho"}</h3>
                <p>{current.secondary_body || "Aplique a alternativa recomendada para melhorar o resultado."}</p>
              </div>
            </div>
          ) : (
            <div className="visualCopy roleAwareCopy">
              {current.highlight && <strong className="visualHighlight">{current.highlight}</strong>}
              {displayRole === "item" && <span className="itemNumber">{String(current.position - 2).padStart(2, "0")}</span>}
              <h3>{current.headline}</h3>
              {current.body && <p>{current.body}</p>}
              {displayRole === "cta" && <span className="ctaVisual">Continue →</span>}
            </div>
          )}

          <div className="visualFooter">
            <span>{initials(brandName)}</span>
            <small>{String(current.position).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</small>
          </div>
        </div>

        <button className="visualNav" type="button" onClick={() => setIndex((v) => (v + 1) % slides.length)} aria-label="Próximo slide">→</button>
      </div>

      <div className="visualThumbs professionalThumbs">
        {slides.map((slide, slideIndex) => {
          const thumbRole = slide.slide_role || fallbackRole(archetype, slide.position, slides.length);
          return (
            <button key={slide.id} type="button" className={slideIndex === index ? "visualThumb active" : "visualThumb"} onClick={() => setIndex(slideIndex)}>
              <b>{String(slide.position).padStart(2, "0")}</b>
              <small>{roleLabels[thumbRole]}</small>
            </button>
          );
        })}
      </div>
    </article>
  );
}
