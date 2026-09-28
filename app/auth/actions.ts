"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/config";

function destination(path: string, key: "error" | "message", value: string) {
  return `${path}?${key}=${encodeURIComponent(value)}`;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(destination("/auth/login", "error", "Informe e-mail e senha."));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(destination("/auth/login", "error", "Não foi possível entrar. Confira seus dados."));
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .limit(1)
    .maybeSingle();

  redirect(membership ? "/" : "/onboarding");
}

export async function signUp(formData: FormData) {
  const fullName = String(formData.get("fullName") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!fullName || !email || password.length < 8) {
    redirect(destination("/auth/register", "error", "Preencha os dados e use uma senha com pelo menos 8 caracteres."));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    redirect(destination("/auth/register", "error", "Não foi possível criar sua conta."));
  }

  if (data.session) {
    redirect("/onboarding");
  }

  redirect(destination("/auth/login", "message", "Conta criada. Confira seu e-mail para confirmar o acesso."));
}
