"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createBrand(formData: FormData) {
  const brandName = String(formData.get("brandName") || "").trim();
  const clientName = String(formData.get("clientName") || "").trim();
  const segment = String(formData.get("segment") || "").trim();
  const instagramHandle = String(formData.get("instagramHandle") || "").trim();
  const audience = String(formData.get("audience") || "").trim();
  const tone = String(formData.get("tone") || "").trim();

  if (brandName.length < 2) {
    redirect("/brands/new?error=" + encodeURIComponent("Informe o nome da marca."));
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/auth/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", userData.user.id)
    .limit(1)
    .single();

  if (membershipError || !membership) {
    redirect("/onboarding");
  }

  let clientId: string | null = null;

  if (clientName) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .insert({ workspace_id: membership.workspace_id, name: clientName })
      .select("id")
      .single();

    if (clientError) {
      redirect("/brands/new?error=" + encodeURIComponent("Não foi possível cadastrar o cliente."));
    }

    clientId = client.id;
  }

  const { error } = await supabase.from("brands").insert({
    workspace_id: membership.workspace_id,
    client_id: clientId,
    name: brandName,
    segment: segment || null,
    instagram_handle: instagramHandle || null,
    audience: audience || null,
    tone: tone || null,
  });

  if (error) {
    redirect("/brands/new?error=" + encodeURIComponent("Não foi possível cadastrar a marca."));
  }

  revalidatePath("/brands");
  redirect("/brands");
}
