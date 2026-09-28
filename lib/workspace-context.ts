import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const getWorkspaceContext = cache(async () => {
  const supabase = await createClient();
  const { data: claimData } = await supabase.auth.getClaims();
  const claims = claimData?.claims;

  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  if (!userId) {
    redirect("/auth/login");
  }

  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase
      .from("workspace_members")
      .select("role,workspace:workspaces(id,name,type)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (!membership) {
    redirect("/onboarding");
  }

  const workspace = Array.isArray(membership.workspace)
    ? membership.workspace[0]
    : membership.workspace;

  if (!workspace) {
    redirect("/onboarding");
  }

  const userMetadata =
    claims?.user_metadata && typeof claims.user_metadata === "object"
      ? claims.user_metadata
      : {};

  return {
    supabase,
    user: {
      id: userId,
      email: typeof claims?.email === "string" ? claims.email : null,
      user_metadata: userMetadata,
    },
    workspace,
    role: membership.role as string,
    profile,
  };
});
