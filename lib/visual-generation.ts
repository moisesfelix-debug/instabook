import { experimental_generateImage as generateImage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { visualFamilyById } from "@/lib/visual-families";

export const IMAGE_MODEL = "recraft/recraft-v4.1";

export type VisualPlacement = "background" | "side" | "card" | "hero";

export type VisualSlideInput = {
  id: string;
  position: number;
  headline: string | null;
  body: string | null;
  slide_role: string | null;
  visual_priority: string | null;
  image_path?: string | null;
};

type VisualContent = {
  id: string;
  content_archetype: string | null;
  art_direction: string | null;
  visual_style: string | null;
  visual_family: string | null;
};

type VisualBrand = {
  name: string;
  segment: string | null;
};

type VisualGuidelines = {
  primary_color: string | null;
  secondary_color: string | null;
};

export function visualPlacement(slide: VisualSlideInput, visualFamily = "atlas"): VisualPlacement {
  const role = slide.slide_role || "body";

  if (slide.position === 1 || role === "hook" || role === "second_hook") {
    return visualFamily === "atlas" ? "card" : "background";
  }

  if (visualFamily === "vitrine") return "hero";
  if (visualFamily === "orbit") return slide.visual_priority === "image" ? "hero" : "card";
  if (visualFamily === "margem") return role === "item" ? "side" : "card";
  if (visualFamily === "pulse") return slide.visual_priority === "image" ? "hero" : "side";

  if (slide.visual_priority === "image") return "hero";
  if (role === "item") return "card";
  return "card";
}

export function selectSlidesForVisuals(slides: VisualSlideInput[], maxVisuals = 3) {
  const cover = slides.find((slide) => slide.position === 1 && slide.slide_role !== "cta");
  const imageFirst = slides.filter(
    (slide) => slide.position !== 1 && slide.slide_role !== "cta" && slide.visual_priority === "image"
  );
  const balanced = slides.filter(
    (slide) => slide.position !== 1 && slide.slide_role !== "cta" && slide.visual_priority === "balanced"
  );
  const fallback = slides.filter(
    (slide) => slide.position !== 1 && slide.slide_role !== "cta" && slide.visual_priority === "text"
  );

  return [cover, ...imageFirst, ...balanced, ...fallback]
    .filter((slide): slide is VisualSlideInput => Boolean(slide))
    .filter((slide, index, array) => array.findIndex((item) => item.id === slide.id) === index)
    .slice(0, maxVisuals);
}


export const FULL_POST_PROMPT_MARKER = "INSTABOOK_FULL_POST_V1";

export const REFERENCE_CAROUSEL_PROMPT_MARKER = "INSTABOOK_REFERENCE_CAROUSEL_V1";

export function buildReferenceCarouselPrompt({
  brandName,
  segment,
  archetype,
  artDirection,
  visualFamily,
  primaryColor,
  secondaryColor,
  position,
  totalSlides,
  role,
  badge,
  headline,
  body,
  highlight,
}: {
  brandName: string;
  segment: string | null;
  archetype: string;
  artDirection: string;
  visualFamily: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  position: number;
  totalSlides: number;
  role: string;
  badge: string | null;
  headline: string | null;
  body: string | null;
  highlight: string | null;
}) {
  return [
    REFERENCE_CAROUSEL_PROMPT_MARKER,
    "Create the FINAL, READY-TO-PUBLISH next slide of an Instagram carousel.",
    "The supplied reference image is slide 1 / the approved cover and is the visual source of truth.",
    "Preserve the SAME visual identity: art direction, typography personality, font weight relationships, palette, contrast, shape language, photographic treatment, texture, margins and overall brand energy.",
    "Do NOT simply copy the cover composition. Design a new composition appropriate to this slide's content while making it unmistakably part of the same carousel.",
    "Canvas: vertical 4:5, equivalent to 1080x1350, edge-to-edge finished artwork.",
    `Brand: ${brandName}. Segment: ${segment || "business"}.`,
    `Carousel: slide ${position} of ${totalSlides}. Role: ${role}. Archetype: ${archetype}. Art direction: ${artDirection}. Visual family: ${visualFamily}.`,
    primaryColor ? `Primary brand color: ${primaryColor}.` : "",
    secondaryColor ? `Secondary brand color: ${secondaryColor}.` : "",
    "TEXT FIDELITY IS CRITICAL. Render the Portuguese copy below exactly as written, with correct spelling and accents.",
    "Do not paraphrase, translate, invent numbers, add extra claims, repeat phrases or create placeholder text.",
    badge ? `BADGE: "${badge}"` : "BADGE: omit if not needed.",
    `MAIN HEADLINE: "${headline || ""}"`,
    highlight ? `SUPPORTING HIGHLIGHT: "${highlight}"` : "",
    body ? `SUPPORTING BODY: "${body}"` : "",
    "Maintain a clear mobile-first hierarchy. The headline is primary; supporting copy must remain secondary and readable.",
    role === "item"
      ? "This is an item/list slide. Make the item identifier visible but avoid repeating it inside the headline."
      : "",
    role === "cta"
      ? "This is the closing CTA slide. Give it a satisfying visual conclusion and clear next-action hierarchy."
      : "",
    role === "comparison"
      ? "This is a comparison slide. Use a clear two-part visual structure while preserving the reference design language."
      : "",
    "Use imagery as an integrated design element rather than wallpaper. Vary crops and placement across the carousel while keeping one coherent campaign.",
    "Do not invent or redesign the brand logo. If a logo symbol is uncertain, use the brand name as clean text only.",
    "No phone mockup, no Instagram interface, no watermark, no lorem ipsum, no gibberish, no extra captions.",
    "Deliver only the finished post artwork.",
  ]
    .filter(Boolean)
    .join(" ");
}



export function buildFullPostImagePrompt({
  brandName,
  segment,
  archetype,
  artDirection,
  primaryColor,
  secondaryColor,
  headline,
  body,
  badge,
  highlight,
  visualFamily,
}: {
  brandName: string;
  segment: string | null;
  archetype: string;
  artDirection: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  headline: string | null;
  body: string | null;
  badge: string | null;
  highlight: string | null;
  visualFamily: string;
}) {
  const family = visualFamilyById(visualFamily);

  return [
    FULL_POST_PROMPT_MARKER,
    "Create the FINAL, READY-TO-PUBLISH Instagram carousel COVER as a complete graphic design, not a background asset.",
    "Canvas: vertical 4:5, equivalent to 1080x1350.",
    `Brand: ${brandName}. Segment: ${segment || "business"}.`,
    `Content archetype: ${archetype}. Art direction: ${artDirection}. Visual family: ${visualFamily}.`,
    `Family art direction: ${family.prompt}.`,
    primaryColor ? `Primary brand color: ${primaryColor}.` : "",
    secondaryColor ? `Secondary brand color: ${secondaryColor}.` : "",
    "You are the art director and graphic designer. Decide the complete composition: photography or illustration, crop, typographic scale, font pairing, spacing, graphic shapes, contrast, layering, rhythm and visual hierarchy.",
    "The final result must look like a high-end social media campaign designed by a senior Brazilian creative studio, not a generic Canva template and not a stock-photo poster.",
    "Use bold composition and intentional asymmetry when appropriate. Preserve strong negative space, clear focal hierarchy and mobile readability.",
    "Do not imitate or reproduce any third-party brand, agency, creator or proprietary template. The design must be original.",
    "TEXT FIDELITY IS CRITICAL. Render the Portuguese text below exactly as written, with correct spelling and accents. Do not paraphrase, translate, add words, invent numbers, or repeat phrases.",
    `BRAND LABEL: "${brandName}"`,
    "If an official brand logo image is supplied as a reference, reproduce that logo faithfully. Do not redesign, restyle, misspell or invent a replacement logo. If no logo reference is supplied, render the brand name as clean text only.",
    badge ? `BADGE: "${badge}"` : "BADGE: omit if it hurts the composition.",
    `MAIN HEADLINE: "${headline || ""}"`,
    highlight ? `SUPPORTING HIGHLIGHT: "${highlight}"` : "",
    body ? `SUPPORTING BODY: "${body}"` : "",
    "The main headline must dominate the hierarchy but should not occupy an oversized opaque rectangle unless the composition genuinely needs it.",
    "Avoid stacking multiple competing headlines. Supporting text must be clearly secondary.",
    "Use imagery as part of the composition, not merely as wallpaper behind text.",
    "No mockup frame, no phone frame, no Instagram UI, no watermark, no lorem ipsum, no gibberish, no additional captions.",
    "Deliver only the finished post artwork edge-to-edge.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildSlideImagePrompt({
  brandName,
  segment,
  archetype,
  artDirection,
  primaryColor,
  secondaryColor,
  headline,
  body,
  role,
  placement,
  visualStyle,
  visualFamily,
}: {
  brandName: string;
  segment: string | null;
  archetype: string;
  artDirection: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  headline: string | null;
  body: string | null;
  role: string;
  placement: VisualPlacement;
  visualStyle: string;
  visualFamily: string;
}) {
  const direction =
    artDirection === "minimal"
      ? "clean premium editorial photography, structured simplicity, refined negative space"
      : artDirection === "split"
        ? "high-contrast commercial editorial photography, clear subject separation, dynamic composition"
        : "bold contemporary editorial campaign photography, art-directed composition, premium magazine feel";

  const styleLanguage =
    visualStyle === "bold_performance"
      ? "bold performance-marketing aesthetic, punchy contrast, graphic energy, dramatic crop, contemporary campaign feel"
      : visualStyle === "clean_consulting"
        ? "premium consulting aesthetic, restrained corporate editorial photography, precise geometry, sophisticated simplicity"
        : visualStyle === "human_editorial"
          ? "human editorial magazine aesthetic, natural candid photography, tactile realism, refined storytelling"
          : visualStyle === "zine_collage"
            ? "independent zine aesthetic, tactile paper textures, collage-ready shapes, imperfect analog energy, artistic framing"
            : visualStyle === "sensory_product"
              ? "sensory product advertising aesthetic, rich materials, appetizing or tactile detail, premium commercial lighting"
              : "contemporary editorial art direction";

  return [
    `Create a professional Instagram visual asset for ${brandName}.`,
    `Brand segment: ${segment || "business"}.`,
    `Content archetype: ${archetype}. Slide role: ${role}. Visual placement: ${placement}.`,
    `Creative direction: ${direction}.`,
    `Internal style system: ${visualStyle}. Aesthetic language: ${styleLanguage}.`,
    `Visual family: ${visualFamily}. Family direction: ${visualFamilyById(visualFamily).prompt}.`,
    `Semantic concept only (never reproduce this wording visually): ${headline || ""}. ${body || ""}`,
    primaryColor ? `Use ${primaryColor} only as a subtle photographic or material accent.` : "",
    secondaryColor ? `Secondary brand tone: ${secondaryColor}, used subtly.` : "",
    "OUTPUT MUST BE A PURE VISUAL ASSET, NOT A POSTER, NOT A SOCIAL MEDIA DESIGN AND NOT A FINISHED CAROUSEL SLIDE.",
    "Vertical 4:5 editorial photograph or illustration only. Show a scene, subject, object, texture or conceptual visual.",
    placement === "background"
      ? "Design it specifically as a subtle full-bleed background: strong atmosphere, simple focal structure, large clean negative space, low visual clutter and no poster-like composition."
      : placement === "side"
        ? "Compose the main subject predominantly on the right side, leaving the left half clean for typography."
        : placement === "card"
          ? "Create a compact editorial scene that crops well inside a rounded rectangular image card."
          : "Create a strong hero image with one clear subject and premium campaign lighting.",
    "Leave intentional negative space where our separate layout engine can place typography later.",
    "ABSOLUTELY NO TEXT: no words, no letters, no numbers, no captions, no signs, no logos, no watermarks, no labels, no interface elements, no fake typography, no poster layout.",
    "Do not draw text-like marks or unreadable pseudo-letters. Avoid generic stock-photo aesthetics, obvious AI artifacts, cheesy business imagery and clutter.",
  ]
    .filter(Boolean)
    .join(" ");
}

export async function generateAndStoreVisuals({
  supabase,
  workspaceId,
  content,
  brand,
  guidelines,
  slides,
  maxVisuals = 3,
}: {
  supabase: SupabaseClient;
  workspaceId: string;
  content: VisualContent;
  brand: VisualBrand;
  guidelines: VisualGuidelines | null;
  slides: VisualSlideInput[];
  maxVisuals?: number;
}) {
  const selected = selectSlidesForVisuals(slides, maxVisuals);

  const results = await Promise.allSettled(
    selected.map(async (slide) => {
      const role = slide.slide_role || "body";
      const placement = visualPlacement(slide, content.visual_family || "atlas");
      const prompt = buildSlideImagePrompt({
        brandName: brand.name,
        segment: brand.segment,
        archetype: content.content_archetype || "general",
        artDirection: content.art_direction || "editorial",
        primaryColor: guidelines?.primary_color || null,
        secondaryColor: guidelines?.secondary_color || null,
        headline: slide.headline,
        body: slide.body,
        role,
        placement,
        visualStyle: content.visual_style || "clean_consulting",
        visualFamily: content.visual_family || "atlas",
      });

      const generated = await generateImage({
        model: IMAGE_MODEL,
        prompt,
        aspectRatio: "4:5",
      });

      const image = generated.images[0];
      if (!image?.base64) throw new Error("Image model returned no image");

      const mediaType = image.mediaType || "image/png";
      const extension =
        mediaType === "image/jpeg" ? "jpg" : mediaType === "image/webp" ? "webp" : "png";
      const path = `${workspaceId}/${content.id}/slide-${slide.position}-ai-${Date.now()}.${extension}`;
      const bytes = Buffer.from(image.base64, "base64");

      const { error: uploadError } = await supabase.storage
        .from("content-assets")
        .upload(path, bytes, { contentType: mediaType, upsert: false });

      if (uploadError) throw uploadError;

      const { error: saveError } = await supabase
        .from("content_slides")
        .update({
          image_path: path,
          image_prompt: prompt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", slide.id)
        .eq("content_id", content.id)
        .eq("workspace_id", workspaceId);

      if (saveError) {
        await supabase.storage.from("content-assets").remove([path]);
        throw saveError;
      }

      if (slide.image_path && slide.image_path !== path) {
        await supabase.storage.from("content-assets").remove([slide.image_path]);
      }

      return slide.id;
    })
  );

  return {
    generatedCount: results.filter((result) => result.status === "fulfilled").length,
    failedCount: results.filter((result) => result.status === "rejected").length,
    attemptedCount: selected.length,
    results,
  };
}

export type FinalArtSlideInput = VisualSlideInput & {
  badge?: string | null;
  highlight?: string | null;
};

export async function generateFinalSunburstCarousel({
  supabase,
  workspaceId,
  content,
  brand,
  guidelines,
  slides,
  logoBytes,
}: {
  supabase: SupabaseClient;
  workspaceId: string;
  content: VisualContent;
  brand: VisualBrand;
  guidelines: VisualGuidelines | null;
  slides: FinalArtSlideInput[];
  logoBytes?: Buffer | null;
}) {
  if (slides.length === 0) {
    return { generatedCount: 0, failedCount: 0, results: [] as PromiseSettledResult<string>[] };
  }

  const ordered = [...slides].sort((a, b) => a.position - b.position);
  const cover = ordered[0];

  const coverPrompt = buildFullPostImagePrompt({
    brandName: brand.name,
    segment: brand.segment,
    archetype: content.content_archetype || "general",
    artDirection: content.art_direction || "editorial",
    primaryColor: guidelines?.primary_color || null,
    secondaryColor: guidelines?.secondary_color || null,
    headline: cover.headline,
    body: cover.body,
    badge: cover.badge || null,
    highlight: cover.highlight || null,
    visualFamily: content.visual_family || "atlas",
  });

  const coverGenerated = await generateImage({
    model: "openai/gpt-image-2.5-sunburst",
    prompt: logoBytes
      ? {
          text: coverPrompt,
          images: [logoBytes],
        }
      : coverPrompt,
    aspectRatio: "4:5",
  });

  const coverImage = coverGenerated.images[0];
  if (!coverImage?.base64) throw new Error("Sunburst returned no cover image");

  const coverMediaType = coverImage.mediaType || "image/png";
  const coverExtension =
    coverMediaType === "image/jpeg" ? "jpg" : coverMediaType === "image/webp" ? "webp" : "png";
  const coverPath = `${workspaceId}/${content.id}/final-ai/slide-1-${Date.now()}.${coverExtension}`;
  const coverBytes = Buffer.from(coverImage.base64, "base64");

  const { error: coverUploadError } = await supabase.storage
    .from("content-assets")
    .upload(coverPath, coverBytes, { contentType: coverMediaType, upsert: false });

  if (coverUploadError) throw coverUploadError;

  const { error: coverSaveError } = await supabase
    .from("content_slides")
    .update({
      image_path: coverPath,
      image_prompt: coverPrompt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cover.id)
    .eq("content_id", content.id)
    .eq("workspace_id", workspaceId);

  if (coverSaveError) {
    await supabase.storage.from("content-assets").remove([coverPath]);
    throw coverSaveError;
  }

  const rest = ordered.slice(1);
  const results = await Promise.allSettled(
    rest.map(async (slide) => {
      const prompt = buildReferenceCarouselPrompt({
        brandName: brand.name,
        segment: brand.segment,
        archetype: content.content_archetype || "general",
        artDirection: content.art_direction || "editorial",
        visualFamily: content.visual_family || "atlas",
        primaryColor: guidelines?.primary_color || null,
        secondaryColor: guidelines?.secondary_color || null,
        position: slide.position,
        totalSlides: ordered.length,
        role: slide.slide_role || "body",
        badge: slide.badge || null,
        headline: slide.headline,
        body: slide.body,
        highlight: slide.highlight || null,
      });

      const images = logoBytes ? [coverBytes, logoBytes] : [coverBytes];

      const generated = await generateImage({
        model: "openai/gpt-image-2.5-sunburst",
        prompt: {
          text: prompt,
          images,
        },
        aspectRatio: "4:5",
      });

      const image = generated.images[0];
      if (!image?.base64) throw new Error(`Sunburst returned no image for slide ${slide.position}`);

      const mediaType = image.mediaType || "image/png";
      const extension =
        mediaType === "image/jpeg" ? "jpg" : mediaType === "image/webp" ? "webp" : "png";
      const path = `${workspaceId}/${content.id}/final-ai/slide-${slide.position}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("content-assets")
        .upload(path, Buffer.from(image.base64, "base64"), {
          contentType: mediaType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: saveError } = await supabase
        .from("content_slides")
        .update({
          image_path: path,
          image_prompt: prompt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", slide.id)
        .eq("content_id", content.id)
        .eq("workspace_id", workspaceId);

      if (saveError) {
        await supabase.storage.from("content-assets").remove([path]);
        throw saveError;
      }

      return slide.id;
    })
  );

  return {
    generatedCount: 1 + results.filter((result) => result.status === "fulfilled").length,
    failedCount: results.filter((result) => result.status === "rejected").length,
    results,
  };
}

