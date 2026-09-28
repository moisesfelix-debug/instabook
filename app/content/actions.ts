"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getWorkspaceContext } from "@/lib/workspace-context";

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
