"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createWorkspace(formData: FormData) {
  const name = String(formData.get("workspaceName") || "").trim();
  const type = String(formData.get("workspaceType") || "creator");

  if (name.length < 2 || !["creator", "professional", "agency"].includes(type)) {
    redirect("/onboarding?error=" + encodeURIComponent("Revise os dados do workspace."));
  }

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/auth/login");
  }

  const { error } = await supabase.rpc("create_workspace", {
    p_name: name,
    p_type: type,
  });

  if (error) {
    redirect("/onboarding?error=" + encodeURIComponent("Não foi possível criar o workspace."));
  }

  redirect("/brands/new");
}
