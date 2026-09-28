import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";

export default async function Home() {
  const { supabase, profile, user, workspace } = await getWorkspaceContext();
  const { data: brandsData } = await supabase
    .from("brands")
    .select("id,name,instagram_handle")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  const brands = brandsData ?? [];
  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    String(user.user_metadata?.full_name || "").trim().split(/\s+/)[0] ||
    "por aqui";
  const primaryBrand = brands[0]?.name || "sua marca";

  const cards = [
    ["Marcas ativas", String(brands.length), workspace.type === "agency" ? "workspace agência" : "neste workspace"],
    ["Conteúdos este mês", "0", "produção ainda não iniciada"],
    ["Agendados", "0", "nenhum agendamento"],
    ["Engajamento médio", "—", "Instagram ainda não conectado"],
  ];

  return (
    <AppShell>
      <header>
        <div>
          <h1>Olá, {firstName} 👋</h1>
          <p>Acompanhe a produção de conteúdo de {workspace.name}.</p>
        </div>
        <Link className="cta" href="/create">＋ Criar conteúdo</Link>
      </header>

      <div className="metrics">
        {cards.map(([label, value, foot]) => (
          <article key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
            <span>{foot}</span>
          </article>
        ))}
      </div>

      <div className="grid">
        <article className="panel large">
          <div className="panelHead">
            <div><h2>Próximos conteúdos</h2><p>Agenda do workspace</p></div>
            <Link href="/calendar">Ver calendário →</Link>
          </div>
          <div className="dashboardEmpty">
            <span>◎</span>
            <b>Nenhum conteúdo agendado ainda</b>
            <p>Quando você começar a criar e agendar conteúdos, eles aparecerão aqui.</p>
            <Link href="/create">Criar primeiro conteúdo</Link>
          </div>
        </article>

        <article className="panel ai">
          <span className="eyebrow">ASSISTENTE IA</span>
          <h2>O que vamos criar hoje?</h2>
          <p>Transforme uma ideia simples em conteúdo pronto para publicar.</p>
          <textarea placeholder="Ex.: Crie um carrossel com 7 slides sobre como aumentar as vendas de um restaurante pelo Instagram..." />
          <div className="promptFooter">
            <small>Marca: <b>{primaryBrand}</b></small>
            <Link href="/create">Gerar ✦</Link>
          </div>
        </article>
      </div>

      <div className="grid bottom">
        <article className="panel">
          <div className="panelHead">
            <div><h2>Marcas ativas</h2><p>Marcas cadastradas neste workspace</p></div>
            <Link href="/brands">Gerenciar →</Link>
          </div>

          {brands.length === 0 ? (
            <div className="dashboardEmpty compact">
              <b>Nenhuma marca cadastrada.</b>
              <Link href="/brands/new">Adicionar marca</Link>
            </div>
          ) : (
            brands.map((brand, i) => (
              <div className="brandRow" key={brand.id}>
                <span className={"brandIcon b" + (i % 3)}>
                  {brand.name.split(" ").map((x: string) => x[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div>
                  <b>{brand.name}</b>
                  <small>{brand.instagram_handle || "Instagram não informado"}</small>
                </div>
                <div><strong>—</strong><small>engajamento</small></div>
              </div>
            ))
          )}
        </article>

        <article className="panel">
          <div className="panelHead">
            <div><h2>Próximos passos</h2><p>Prepare o workspace para produzir</p></div>
          </div>
          <div className="setupItem"><span>1</span><div><b>Complete a identidade da marca</b><small>Público, tom, site e Instagram ajudam a IA a produzir melhor.</small></div><Link href="/brands">Configurar</Link></div>
          <div className="setupItem"><span>2</span><div><b>Crie o primeiro conteúdo</b><small>Vamos conectar a geração por IA na próxima etapa.</small></div><Link href="/create">Abrir criador</Link></div>
        </article>
      </div>
    </AppShell>
  );
}
