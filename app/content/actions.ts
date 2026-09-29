"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { experimental_generateImage as generateImage } from "ai";
import { buildFullPostImagePrompt, buildReferenceCarouselPrompt, FULL_POST_PROMPT_MARKER, REFERENCE_CAROUSEL_PROMPT_MARKER, generateAndStoreVisuals } from "@/lib/visual-generation";

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



export async function generateCarouselVisuals(formData: FormData) {
  const contentId = String(formData.get("contentId") || "");
  if (!contentId) redirect("/library");

  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: content }, { data: slides }] = await Promise.all([
    supabase
      .from("contents")
      .select("id,brand_id,type,content_archetype,art_direction,visual_style,visual_family")
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

  if (!content || !["carousel", "post"].includes(content.type) || !slides?.length) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("Não encontrei um conteúdo visual válido para gerar as imagens.")}`);
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

  const result = await generateAndStoreVisuals({
    supabase,
    workspaceId: workspace.id,
    content,
    brand,
    guidelines: guidelines || null,
    slides,
    maxVisuals: content.type === "post" ? 1 : 3,
  });

  if (result.generatedCount === 0) {
    console.error("instabook.image_generation_failed", result.results);
    redirect(`/content/${contentId}?error=${encodeURIComponent("Não foi possível gerar os visuais com IA agora.")}`);
  }

  revalidatePath(`/content/${contentId}`);
  redirect(`/content/${contentId}?asset=ai&generated=${result.generatedCount}`);
}


const IMAGE_COMPARISON_MODELS = [
  { model: "recraft/recraft-v4.1", label: "Recraft V4.1" },
  { model: "recraft/recraft-v4.1-pro", label: "Recraft V4.1 Pro" },
  { model: "openai/gpt-image-2.5-flare", label: "GPT Image 2.5 Flare" },
  { model: "openai/gpt-image-2.5-sunburst", label: "GPT Image 2.5 Sunburst" },
] as const;

export async function compareImageModels(formData: FormData) {
  const contentId = String(formData.get("contentId") || "");
  if (!contentId) redirect("/library");

  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: content }, { data: slides }] = await Promise.all([
    supabase
      .from("contents")
      .select("id,brand_id,type,content_archetype,art_direction,visual_style,visual_family")
      .eq("id", contentId)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("content_slides")
      .select("id,position,headline,body,slide_role,visual_priority,badge,highlight,image_path,image_prompt")
      .eq("content_id", contentId)
      .eq("workspace_id", workspace.id)
      .order("position"),
  ]);

  if (!content || !["carousel", "post"].includes(content.type) || !slides?.length) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("Não encontrei um conteúdo visual válido para comparar.")}`);
  }

  const slide = slides.find((item) => item.position === 1) || slides[0];

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

  const prompt = buildFullPostImagePrompt({
    brandName: brand.name,
    segment: brand.segment,
    archetype: content.content_archetype || "general",
    artDirection: content.art_direction || "editorial",
    primaryColor: guidelines?.primary_color || null,
    secondaryColor: guidelines?.secondary_color || null,
    headline: slide.headline,
    body: slide.body,
    badge: slide.badge || null,
    highlight: slide.highlight || null,
    visualFamily: content.visual_family || "atlas",
  });

  if (!prompt.startsWith(FULL_POST_PROMPT_MARKER)) throw new Error("Invalid full-post prompt");

  const batchId = crypto.randomUUID();

  const results = await Promise.allSettled(
    IMAGE_COMPARISON_MODELS.map(async ({ model, label }) => {
      const generated = await generateImage({
        model,
        prompt,
        aspectRatio: "4:5",
      });

      const image = generated.images[0];
      if (!image?.base64) throw new Error(`${model} returned no image`);

      const mediaType = image.mediaType || "image/png";
      const extension =
        mediaType === "image/jpeg" ? "jpg" : mediaType === "image/webp" ? "webp" : "png";
      const modelSlug = model.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const path = `${workspace.id}/${contentId}/full-post-comparisons/${batchId}/${modelSlug}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("content-assets")
        .upload(path, Buffer.from(image.base64, "base64"), {
          contentType: mediaType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("content_visual_comparisons")
        .insert({
          workspace_id: workspace.id,
          content_id: contentId,
          slide_id: slide.id,
          batch_id: batchId,
          model,
          label,
          image_path: path,
          prompt,
        });

      if (insertError) {
        await supabase.storage.from("content-assets").remove([path]);
        throw insertError;
      }

      return model;
    })
  );

  const successCount = results.filter((result) => result.status === "fulfilled").length;
  if (successCount === 0) {
    console.error("instabook.image_model_comparison_failed", results);
    redirect(`/content/${contentId}?error=${encodeURIComponent("Nenhum dos três modelos conseguiu gerar a comparação.")}`);
  }

  if (successCount < IMAGE_COMPARISON_MODELS.length) {
    console.warn("instabook.image_model_comparison_partial", results);
  }

  revalidatePath(`/content/${contentId}`);
  redirect(`/content/${contentId}?compare=1&compared=${successCount}`);
}

const SUNBURST_MODEL = "openai/gpt-image-2.5-sunburst";

export async function generateSunburstCarouselFromReference(formData: FormData) {
  const contentId = String(formData.get("contentId") || "");
  const comparisonId = String(formData.get("comparisonId") || "");
  if (!contentId || !comparisonId) redirect("/library");

  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: comparison }, { data: content }, { data: slides }] = await Promise.all([
    supabase
      .from("content_visual_comparisons")
      .select("id,content_id,slide_id,image_path,model,label,prompt")
      .eq("id", comparisonId)
      .eq("content_id", contentId)
      .eq("workspace_id", workspace.id)
      .like("prompt", `${FULL_POST_PROMPT_MARKER}%`)
      .maybeSingle(),
    supabase
      .from("contents")
      .select("id,brand_id,type,content_archetype,art_direction,visual_family")
      .eq("id", contentId)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("content_slides")
      .select("id,position,headline,body,slide_role,visual_priority,badge,highlight")
      .eq("content_id", contentId)
      .eq("workspace_id", workspace.id)
      .order("position"),
  ]);

  if (!comparison || !content || content.type !== "carousel" || !slides?.length || slides.length < 2) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("Não encontrei uma capa de referência ou um carrossel válido.")}`);
  }

  const cover = slides.find((slide) => slide.position === 1) || slides[0];
  if (comparison.slide_id !== cover.id) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("A direção visual precisa partir da capa do carrossel.")}`);
  }

  const [{ data: brand }, { data: guidelines }, { data: referenceBlob, error: referenceError }] = await Promise.all([
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
    supabase.storage.from("content-assets").download(comparison.image_path),
  ]);

  if (!brand || referenceError || !referenceBlob) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("Não foi possível carregar a capa escolhida como referência.")}`);
  }

  const referenceBytes = Buffer.from(await referenceBlob.arrayBuffer());
  const batchId = crypto.randomUUID();

  const coverPrompt = [
    REFERENCE_CAROUSEL_PROMPT_MARKER,
    `REFERENCE COVER. Source comparison: ${comparison.id}.`,
    "This image is the approved visual direction for the carousel.",
  ].join(" ");

  const { error: coverInsertError } = await supabase
    .from("content_visual_comparisons")
    .insert({
      workspace_id: workspace.id,
      content_id: contentId,
      slide_id: cover.id,
      batch_id: batchId,
      model: comparison.model,
      label: "01 · Capa referência",
      image_path: comparison.image_path,
      prompt: coverPrompt,
    });

  if (coverInsertError) {
    redirect(`/content/${contentId}?error=${encodeURIComponent("Não foi possível iniciar o carrossel de referência.")}`);
  }

  const remainingSlides = slides.filter((slide) => slide.id !== cover.id);
  const results = await Promise.allSettled(
    remainingSlides.map(async (slide) => {
      const prompt = buildReferenceCarouselPrompt({
        brandName: brand.name,
        segment: brand.segment,
        archetype: content.content_archetype || "general",
        artDirection: content.art_direction || "editorial",
        visualFamily: content.visual_family || "atlas",
        primaryColor: guidelines?.primary_color || null,
        secondaryColor: guidelines?.secondary_color || null,
        position: slide.position,
        totalSlides: slides.length,
        role: slide.slide_role || "body",
        badge: slide.badge || null,
        headline: slide.headline,
        body: slide.body,
        highlight: slide.highlight || null,
      });

      const generated = await generateImage({
        model: SUNBURST_MODEL,
        prompt: {
          text: prompt,
          images: [referenceBytes],
        },
        aspectRatio: "4:5",
      });

      const image = generated.images[0];
      if (!image?.base64) throw new Error(`Sunburst returned no image for slide ${slide.position}`);

      const mediaType = image.mediaType || "image/png";
      const extension =
        mediaType === "image/jpeg" ? "jpg" : mediaType === "image/webp" ? "webp" : "png";
      const path = `${workspace.id}/${contentId}/reference-carousels/${batchId}/slide-${slide.position}-sunburst.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("content-assets")
        .upload(path, Buffer.from(image.base64, "base64"), {
          contentType: mediaType,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("content_visual_comparisons")
        .insert({
          workspace_id: workspace.id,
          content_id: contentId,
          slide_id: slide.id,
          batch_id: batchId,
          model: SUNBURST_MODEL,
          label: `${String(slide.position).padStart(2, "0")} · Sunburst`,
          image_path: path,
          prompt,
        });

      if (insertError) {
        await supabase.storage.from("content-assets").remove([path]);
        throw insertError;
      }

      return slide.position;
    })
  );

  const generatedCount = results.filter((result) => result.status === "fulfilled").length;
  const failedCount = results.length - generatedCount;

  if (generatedCount === 0) {
    console.error("instabook.reference_carousel_failed", results);
    redirect(`/content/${contentId}?error=${encodeURIComponent("O Sunburst não conseguiu gerar os próximos slides desta vez.")}`);
  }

  if (failedCount > 0) {
    console.warn("instabook.reference_carousel_partial", { contentId, generatedCount, failedCount, results });
  }

  revalidatePath(`/content/${contentId}`);
  redirect(`/content/${contentId}?carouselAi=1&carouselGenerated=${generatedCount}&carouselFailed=${failedCount}`);
}

