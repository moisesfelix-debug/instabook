import type { ReactNode } from "react";
import { SidebarNav } from "@/components/sidebar-nav";
import { getWorkspaceContext } from "@/lib/workspace-context";

export async function AppShell({ children }: { children: ReactNode }) {
  const { user, profile, workspace, role } = await getWorkspaceContext();
  const userName =
    profile?.full_name?.trim() ||
    String(user.user_metadata?.full_name || "").trim() ||
    user.email?.split("@")[0] ||
    "Usuário";

  return (
    <main className="shell">
      <SidebarNav
        workspaceName={workspace.name}
        workspaceType={workspace.type}
        userName={userName}
        role={role}
      />
      <section className="content">{children}</section>
    </main>
  );
}
