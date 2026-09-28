import { experimental_generateImage as generateImage } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";

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
};

type VisualBrand = {
  name: string;
  segment: string | null;
};

type VisualGuidelines = {
  primary_color: string | null;
  secondary_color: string | null;
};

export function visualPlacement(slide: VisualSlideInput): VisualPlacement {
  const role = slide.slide_role || "body";

  if (slide.position === 1 || role === "hook" || role === "second_hook") {
    return "background";
  }

  if (slide.visual_priority === "image") return "hero";
  if (role === "item") return "side";
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
}) {
  const direction =
    artDirection === "minimal"
      ? "clean premium editorial photography, structured simplicity, refined negative space"
      : artDirection === "split"
        ? "high-contrast commercial editorial photography, clear subject separation, dynamic composition"
        : "bold contemporary editorial campaign photography, art-directed composition, premium magazine feel";

  return [
    `Create a professional Instagram visual asset for ${brandName}.`,
    `Brand segment: ${segment || "business"}.`,
    `Content archetype: ${archetype}. Slide role: ${role}. Visual placement: ${placement}.`,
    `Creative direction: ${direction}.`,
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
      const placement = visualPlacement(slide);
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
