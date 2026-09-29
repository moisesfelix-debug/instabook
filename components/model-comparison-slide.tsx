import type { CSSProperties } from "react";
type ComparisonSlide = {
  position: number;
  headline: string | null;
  body: string | null;
  slide_role?: string | null;
  visual_priority?: string | null;
  badge?: string | null;
  highlight?: string | null;
};

const roleLabels: Record<string, string> = {
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

function normalizeCopy(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function visibleHighlight(slide: ComparisonSlide) {
  const highlight = normalizeCopy(slide.highlight);
  const headline = normalizeCopy(slide.headline);
  if (!highlight) return null;
  if (headline === highlight || headline.includes(highlight)) return null;
  return slide.highlight;
}

function displayHeadline(slide: ComparisonSlide) {
  const value = (slide.headline || "").trim();
  if (slide.slide_role !== "item" || !slide.badge) return value;
  return value
    .replace(/^(erro|passo|dica|item|etapa)\s*0*\d+\s*[:\-–—]?\s*/i, "")
    .trim() || value;
}

function placementForCover(family: string) {
  return family === "atlas" ? "card" : "background";
}

export function ModelComparisonSlide({
  brandName,
  primaryColor,
  secondaryColor,
  logoUrl,
  artDirection,
  visualStyle,
  visualFamily,
  slide,
  totalSlides,
  imageUrl,
}: {
  brandName: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  artDirection?: string | null;
  visualStyle?: string | null;
  visualFamily?: string | null;
  slide?: ComparisonSlide | null;
  totalSlides: number;
  imageUrl: string | null;
}) {
  if (!slide) return null;

  const family = ["pulse", "atlas", "margem", "orbit", "vitrine"].includes(visualFamily || "")
    ? String(visualFamily)
    : "atlas";
  const direction = ["editorial", "split", "minimal"].includes(artDirection || "")
    ? String(artDirection)
    : "editorial";
  const style = visualStyle || "bold_performance";
  const role = slide.slide_role || "hook";
  const placement = placementForCover(family);
  const primary = safeColor(primaryColor, "#6d4aff");
  const secondary = safeColor(secondaryColor, "#171923");
  const cssVars = {
    "--visual-primary": primary,
    "--visual-secondary": secondary,
  } as CSSProperties;
  const heroStyle = imageUrl
    ? ({ backgroundImage: `url("${imageUrl}")` } as CSSProperties)
    : undefined;
  const logoStyle = logoUrl
    ? ({ backgroundImage: `url("${logoUrl}")` } as CSSProperties)
    : undefined;
  const highlight = visibleHighlight(slide);
  const headline = displayHeadline(slide);

  return (
    <div
      className={`visualCanvas proCanvas modelCompareRenderedSlide ${direction} style-${style} family-${family} role-${role} priority-${slide.visual_priority || "balanced"} image-${placement} ${imageUrl ? "hasHero" : ""}`}
      style={cssVars}
      data-slide={String(slide.position).padStart(2, "0")}
    >
      {imageUrl && (
        <div className="visualHeroLayer" style={heroStyle} />
      )}

      <div className="visualTop">
        <span className="visualBrandName">
          <i
            className={logoUrl ? "visualLogo hasImage" : "visualLogo"}
            style={logoStyle}
          >
            {!logoUrl && initials(brandName)}
          </i>
          <em>{brandName}</em>
        </span>
        <span className="roleChip">{slide.badge || roleLabels[role] || "CONTEÚDO"}</span>
      </div>

      <div className="visualCopy roleAwareCopy">
        {highlight && <strong className="visualHighlight">{highlight}</strong>}
        <h3>{headline}</h3>
        {slide.body && <p>{slide.body}</p>}
      </div>

      <div className="visualFooter">
        <span>{initials(brandName)}</span>
        <small>{String(slide.position).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}</small>
      </div>
    </div>
  );
}
