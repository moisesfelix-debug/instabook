"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { experimental_generateImage as generateImage } from "ai";

export async function updateContent(formData: FormData) {
  const contentId = String(formData.get("contentId") || "");
  const title = String(formData.get("title") || "").trim();
  const hook = String(formData.get("hook") || "").trim();
  const caption = String(formData.get("caption") || "").trim();
  const cta = String(formData.get("cta") || "").trim();
  const reelScript = String(formData.get("reelScript") || "").trim();
  const status = String(formData.get("status") || "draft");
  const hashtags = String(formData.get("hashtags") || "")
    .split(/[\s,]+/)
    .map((item) => item.replace(/^#/, "").trim())
    .filter(Boolean)
    .slice(0, 20);

  if (!contentId || title.length < 3) return;

  const { supabase, workspace } = await getWorkspaceContext();

  const { error } = await supabase
    .from("contents")
    .update({
      title,
      hook: hook || null,
      caption: caption || null,
      cta: cta || null,
      reel_script: reelScript || null,
      hashtags,
      status: ["draft", "review", "changes_requested", "approved"].includes(status) ? status : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", contentId)
    .eq("workspace_id", workspace.id);

  if (error) return;

  const slideIds = String(formData.get("slideIds") || "").split(",").filter(Boolean);
  await Promise.all(
    slideIds.map((slideId) =>
      supabase
        .from("content_slides")
        .update({
          headline: String(formData.get(`slideHeadline_${slideId}`) || "").trim() || null,
          body: String(formData.get(`slideBody_${slideId}`) || "").trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", slideId)
        .eq("workspace_id", workspace.id)
        .eq("content_id", contentId)
    )
  );

  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath(`/content/${contentId}`);
  redirect(`/content/${contentId}?saved=1`);
}

export async function deleteContent(formData: FormData) {
  const contentId = String(formData.get("contentId") || "");
  if (!contentId) return;

  const { supabase, workspace } = await getWorkspaceContext();
  await supabase.from("contents").delete().eq("id", contentId).eq("workspace_id", workspace.id);

  revalidatePath("/");
  revalidatePath("/library");
  redirect("/library");
}


function imageExtension(file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return extensions[file.type] || null;
}

export async function uploadContentHero(formData: FormData) {
  const contentId = String(formData.get("contentId") || "");
  const file = formData.get("heroFile");

  if (!contentId || !(file instanceof File) || file.size === 0) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("Escolha uma imagem para o conteúdo.")}`);
  }

  const extension = imageExtension(file);
  if (!extension || file.size > 8 * 1024 * 1024) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("Use uma imagem JPG, PNG ou WebP de até 8 MB.")}`);
  }

  const { supabase, workspace } = await getWorkspaceContext();
  const { data: content } = await supabase
    .from("contents")
    .select("id,hero_image_path")
    .eq("id", contentId)
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (!content) {
    redirect("/library");
  }

  const path = `${workspace.id}/${contentId}/hero-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("content-assets")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("Não foi possível enviar a imagem.")}`);
  }

  const { error: saveError } = await supabase
    .from("contents")
    .update({ hero_image_path: path, updated_at: new Date().toISOString() })
    .eq("id", contentId)
    .eq("workspace_id", workspace.id);

  if (saveError) {
    await supabase.storage.from("content-assets").remove([path]);
    redirect(`/content/${contentId}?error=${encodeURIComponent("A imagem foi enviada, mas não foi possível vinculá-la ao conteúdo.")}`);
  }

  if (content.hero_image_path && content.hero_image_path !== path) {
    await supabase.storage.from("content-assets").remove([content.hero_image_path]);
  }

  revalidatePath("/library");
  revalidatePath(`/content/${contentId}`);
  redirect(`/content/${contentId}?asset=hero`);
}


const IMAGE_MODEL = "recraft/recraft-v4.1";

function buildSlideImagePrompt({
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
  placement: "background" | "side" | "card" | "hero";
}) {
  const direction =
    artDirection === "minimal"
      ? "clean premium editorial photography, structured simplicity, refined negative space"
      : artDirection === "split"
        ? "high-contrast commercial editorial photography, clear subject separation, dynamic composition"
        : "bold contemporary editorial campaign photography, art-directed composition, premium magazine feel";

  return [
    `Create a professional Instagram carousel visual asset for ${brandName}.`,
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

export async function generateCarouselVisuals(formData: FormData) {
  const contentId = String(formData.get("contentId") || "");
  if (!contentId) redirect("/library");

  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: content }, { data: slides }] = await Promise.all([
    supabase
      .from("contents")
      .select("id,brand_id,type,content_archetype,art_direction")
      .eq("id", contentId)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("content_slides")
      .select("id,position,headline,body,slide_role,visual_priority,image_path")
      .eq("content_id", contentId)
      .eq("workspace_id", workspace.id)
      .order("position"),
  ]);

  if (!content || content.type !== "carousel" || !slides?.length) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("Não encontrei um carrossel válido para gerar os visuais.")}`);
  }

  const [{ data: brand }, { data: guidelines }] = await Promise.all([
    supabase
      .from("brands")
      .select("name,segment")
      .eq("id", content.brand_id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("brand_guidelines")
      .select("primary_color,secondary_color")
      .eq("brand_id", content.brand_id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
  ]);

  if (!brand) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("A marca desse conteúdo não foi encontrada.")}`);
  }

  const cover = slides.find((slide) => slide.position === 1 && slide.slide_role !== "cta");
  const imageFirst = slides.filter(
    (slide) => slide.position !== 1 && slide.slide_role !== "cta" && slide.visual_priority === "image"
  );
  const balanced = slides.filter(
    (slide) => slide.position !== 1 && slide.slide_role !== "cta" && slide.visual_priority === "balanced"
  );

  // The cover gets a background asset, while internal slides get image-led support where useful.
  const selected = [cover, ...imageFirst, ...balanced]
    .filter((slide): slide is NonNullable<typeof slide> => Boolean(slide))
    .filter((slide, index, array) => array.findIndex((item) => item.id === slide.id) === index)
    .slice(0, 3);

  const results = await Promise.allSettled(
    selected.map(async (slide) => {
      const role = slide.slide_role || "body";
      const placement =
        slide.position === 1 || role === "hook" || role === "second_hook"
          ? "background"
          : slide.visual_priority === "image"
            ? "hero"
            : role === "item"
              ? "side"
              : "card";

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
      const extension = mediaType === "image/jpeg" ? "jpg" : mediaType === "image/webp" ? "webp" : "png";
      const path = `${workspace.id}/${contentId}/slide-${slide.position}-ai-${Date.now()}.${extension}`;
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
        .eq("content_id", contentId)
        .eq("workspace_id", workspace.id);

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

  const generatedCount = results.filter((result) => result.status === "fulfilled").length;

  if (generatedCount === 0) {
    console.error("instabook.image_generation_failed", results);
    redirect(`/content/${contentId}?error=${encodeURIComponent("Não foi possível gerar os visuais com IA agora.")}`);
  }

  revalidatePath(`/content/${contentId}`);
  redirect(`/content/${contentId}?asset=ai&generated=${generatedCount}`);
}
