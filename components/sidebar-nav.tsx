"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";

const items = [
  ["Visão geral", "/"],
  ["Criar conteúdo", "/create"],
  ["Calendário", "/calendar"],
  ["Biblioteca", "/library"],
  ["Marcas & clientes", "/brands"],
  ["Analytics", "/analytics"],
  ["Aprovações", "/approvals"],
] as const;

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const workspaceLabels: Record<string, string> = {
  creator: "Workspace creator",
  professional: "Workspace profissional",
  agency: "Workspace agência",
};

const roleLabels: Record<string, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  strategist: "Estrategista",
  creator: "Criador",
  reviewer: "Revisor",
  client: "Cliente",
};

export function SidebarNav({
  workspaceName,
  workspaceType,
  userName,
  role,
}: {
  workspaceName: string;
  workspaceType: string;
  userName: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="mark">IB</span>
        <b>InstaBook</b>
      </Link>

      <div className="workspace">
        <span>{initials(workspaceName)}</span>
        <div>
          <b>{workspaceName}</b>
          <small>{workspaceLabels[workspaceType] || "Workspace"}</small>
        </div>
      </div>

      <nav>
        {items.map(([label, href]) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link className={active ? "active" : ""} href={href} key={href}>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="profile">
        <span>{initials(userName)}</span>
        <div className="profileMeta">
          <b>{userName}</b>
          <small>{roleLabels[role] || role}</small>
        </div>
        <form action={signOut}>
          <button className="profileLogout" type="submit" title="Sair">↪</button>
        </form>
      </div>
    </aside>
  );
}
