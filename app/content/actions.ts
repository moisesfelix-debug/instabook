"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { generateAndStoreVisuals } from "@/lib/visual-generation";

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
