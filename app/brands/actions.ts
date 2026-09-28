"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getWorkspaceContext } from "@/lib/workspace-context";

function cleanHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

function listValue(formData: FormData, name: string) {
  return String(formData.get(name) || "")
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function guidelinePayload(formData: FormData, workspaceId: string, brandId: string) {
  return {
    brand_id: brandId,
    workspace_id: workspaceId,
    primary_color: String(formData.get("primaryColor") || "").trim() || null,
    secondary_color: String(formData.get("secondaryColor") || "").trim() || null,
    default_cta: String(formData.get("defaultCta") || "").trim() || null,
    voice_notes: String(formData.get("voiceNotes") || "").trim() || null,
    value_proposition: String(formData.get("valueProposition") || "").trim() || null,
    visual_direction: String(formData.get("visualDirection") || "").trim() || null,
    content_pillars: listValue(formData, "contentPillars"),
    preferred_words: listValue(formData, "preferredWords"),
    forbidden_words: listValue(formData, "forbiddenWords"),
    updated_at: new Date().toISOString(),
  };
}

async function resolveClientId(
  supabase: SupabaseClient,
  workspaceId: string,
  requestedClientId: string
) {
  if (!requestedClientId) return null;

  const { data } = await supabase
    .from("clients")
    .select("id")
    .eq("id", requestedClientId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return data?.id || null;
}

export async function createBrand(formData: FormData) {
  const brandName = String(formData.get("brandName") || "").trim();
  const clientName = String(formData.get("clientName") || "").trim();
  const requestedClientId = String(formData.get("existingClientId") || "");
  const segment = String(formData.get("segment") || "").trim();
  const instagramHandle = cleanHandle(String(formData.get("instagramHandle") || ""));
  const audience = String(formData.get("audience") || "").trim();
  const tone = String(formData.get("tone") || "").trim();
  const website = String(formData.get("website") || "").trim();

  if (brandName.length < 2) {
    redirect("/brands/new?error=" + encodeURIComponent("Informe o nome da marca."));
  }

  const { supabase, workspace } = await getWorkspaceContext();
  let clientId = await resolveClientId(supabase, workspace.id, requestedClientId);

  if (!clientId && clientName) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({ workspace_id: workspace.id, name: clientName })
      .select("id")
      .single();

    if (clientError || !client) {
      redirect("/brands/new?error=" + encodeURIComponent("Não foi possível cadastrar o cliente."));
    }

    clientId = client.id;
  }

  const { data: brand, error } = await supabase
    .from("brands")
    .insert({
      workspace_id: workspace.id,
      client_id: clientId,
      name: brandName,
      segment: segment || null,
      instagram_handle: instagramHandle,
      audience: audience || null,
      tone: tone || null,
      website: website || null,
    })
    .select("id")
    .single();

  if (error || !brand) {
    redirect("/brands/new?error=" + encodeURIComponent("Não foi possível cadastrar a marca."));
  }

  await supabase.from("brand_guidelines").upsert(
    guidelinePayload(formData, workspace.id, brand.id),
    { onConflict: "brand_id" }
  );

  revalidatePath("/");
  revalidatePath("/brands");
  redirect("/brands");
}

export async function updateBrand(formData: FormData) {
  const brandId = String(formData.get("brandId") || "");
  const brandName = String(formData.get("brandName") || "").trim();
  const requestedClientId = String(formData.get("clientId") || "");
  const segment = String(formData.get("segment") || "").trim();
  const instagramHandle = cleanHandle(String(formData.get("instagramHandle") || ""));
  const website = String(formData.get("website") || "").trim();
  const audience = String(formData.get("audience") || "").trim();
  const tone = String(formData.get("tone") || "").trim();

  if (!brandId || brandName.length < 2) {
    redirect(`/brands/${brandId}/edit?error=${encodeURIComponent("Revise os dados da marca.")}`);
  }

  const { supabase, workspace } = await getWorkspaceContext();
  const clientId = await resolveClientId(supabase, workspace.id, requestedClientId);

  const { error } = await supabase
    .from("brands")
    .update({
      name: brandName,
      client_id: clientId,
      segment: segment || null,
      instagram_handle: instagramHandle,
      website: website || null,
      audience: audience || null,
      tone: tone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", brandId)
    .eq("workspace_id", workspace.id);

  if (error) {
    redirect(`/brands/${brandId}/edit?error=${encodeURIComponent("Não foi possível atualizar a marca.")}`);
  }

  await supabase.from("brand_guidelines").upsert(
    guidelinePayload(formData, workspace.id, brandId),
    { onConflict: "brand_id" }
  );

  revalidatePath("/");
  revalidatePath("/brands");
  redirect("/brands");
}

export async function deleteBrand(formData: FormData) {
  const brandId = String(formData.get("brandId") || "");
  if (!brandId) return;

  const { supabase, workspace } = await getWorkspaceContext();
  await supabase.from("brands").delete().eq("id", brandId).eq("workspace_id", workspace.id);

  revalidatePath("/");
  revalidatePath("/brands");
}

export async function createAgencyClient(formData: FormData) {
  const name = String(formData.get("clientName") || "").trim();
  const email = String(formData.get("clientEmail") || "").trim();
  if (name.length < 2) return;

  const { supabase, workspace } = await getWorkspaceContext();
  await supabase.from("clients").insert({
    workspace_id: workspace.id,
    name,
    email: email || null,
  });

  revalidatePath("/brands");
}

export async function updateAgencyClient(formData: FormData) {
  const clientId = String(formData.get("clientId") || "");
  const name = String(formData.get("clientName") || "").trim();
  const email = String(formData.get("clientEmail") || "").trim();
  if (!clientId || name.length < 2) return;

  const { supabase, workspace } = await getWorkspaceContext();
  await supabase
    .from("clients")
    .update({ name, email: email || null, updated_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("workspace_id", workspace.id);

  revalidatePath("/brands");
}

export async function deleteAgencyClient(formData: FormData) {
  const clientId = String(formData.get("clientId") || "");
  if (!clientId) return;

  const { supabase, workspace } = await getWorkspaceContext();
  await supabase.from("clients").delete().eq("id", clientId).eq("workspace_id", workspace.id);

  revalidatePath("/brands");
}


function imageExtension(file: File) {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return extensions[file.type] || null;
}

export async function uploadBrandLogo(formData: FormData) {
  const brandId = String(formData.get("brandId") || "");
  const file = formData.get("logoFile");

  if (!brandId || !(file instanceof File) || file.size === 0) {
    redirect(`/brands/${brandId}/edit?error=${encodeURIComponent("Escolha uma imagem para o logo.")}`);
  }

  const extension = imageExtension(file);
  if (!extension || file.size > 5 * 1024 * 1024) {
    redirect(`/brands/${brandId}/edit?error=${encodeURIComponent("Use um logo JPG, PNG ou WebP de até 5 MB.")}`);
  }

  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: brand }, { data: currentGuidelines }] = await Promise.all([
    supabase
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("brand_guidelines")
      .select("logo_path")
      .eq("brand_id", brandId)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
  ]);

  if (!brand) {
    redirect("/brands?error=" + encodeURIComponent("Marca não encontrada."));
  }

  const path = `${workspace.id}/${brandId}/logo-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("brand-assets")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    redirect(`/brands/${brandId}/edit?error=${encodeURIComponent("Não foi possível enviar o logo.")}`);
  }

  const { error: saveError } = await supabase.from("brand_guidelines").upsert(
    {
      brand_id: brandId,
      workspace_id: workspace.id,
      logo_path: path,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "brand_id" }
  );

  if (saveError) {
    await supabase.storage.from("brand-assets").remove([path]);
    redirect(`/brands/${brandId}/edit?error=${encodeURIComponent("O logo foi enviado, mas não foi possível vinculá-lo à marca.")}`);
  }

  if (currentGuidelines?.logo_path && currentGuidelines.logo_path !== path) {
    await supabase.storage.from("brand-assets").remove([currentGuidelines.logo_path]);
  }

  revalidatePath("/brands");
  revalidatePath(`/brands/${brandId}/edit`);
  redirect(`/brands/${brandId}/edit?asset=logo`);
}
