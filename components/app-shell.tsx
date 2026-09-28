"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const items = [
  ["Visão geral", "/"],
  ["Criar conteúdo", "/create"],
  ["Calendário", "/calendar"],
  ["Biblioteca", "/library"],
  ["Marcas & clientes", "/brands"],
  ["Analytics", "/analytics"],
  ["Aprovações", "/approvals"],
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <main className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand"><span className="mark">IB</span><b>InstaBook</b></Link>
        <div className="workspace"><span>SB</span><div><b>SaborBoost</b><small>Workspace agência</small></div></div>
        <nav>
          {items.map(([label, href]) => (
            <Link className={pathname === href ? "active" : ""} href={href} key={href}>{label}</Link>
          ))}
        </nav>
        <div className="profile"><span>MF</span><div><b>Moisés Felix</b><small>Administrador</small></div></div>
      </aside>
      <section className="content">{children}</section>
    </main>
  );
}
