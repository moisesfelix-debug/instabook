import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";

export default async function Home() {
  const { supabase, profile, user, workspace } = await getWorkspaceContext();

  const [{ data: brandsData }, { data: contentsData }] = await Promise.all([
    supabase
      .from("brands")
      .select("id,name,instagram_handle")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("contents")
      .select("id,brand_id,type,title,status,scheduled_at,created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false }),
  ]);

  const brands = brandsData ?? [];
  const contents = contentsData ?? [];
  const firstName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    String(user.user_metadata?.full_name || "").trim().split(/\s+/)[0] ||
    "por aqui";
  const primaryBrand = brands[0]?.name || "sua marca";
  const brandNames = new Map(brands.map((brand) => [brand.id, brand.name] as const));

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const thisMonth = contents.filter((item) => new Date(item.created_at) >= monthStart).length;
  const scheduled = contents.filter((item) => item.status === "scheduled").length;
  const published = contents.filter((item) => item.status === "published").length;
  const upcoming = contents
    .filter((item) => item.scheduled_at && new Date(item.scheduled_at) >= now)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
    .slice(0, 4);

  const cards = [
    ["Conteúdos este mês", String(thisMonth), contents.length ? `${contents.length} no total` : "comece pelo primeiro"],
    ["Rascunhos", String(contents.filter((item) => item.status === "draft").length), "em produção"],
    ["Agendados", String(scheduled), scheduled ? "próximas publicações" : "nenhum agendamento"],
    ["Publicados", String(published), "via Instagram em breve"],
  ];

  return (
    <AppShell>
      <header>
        <div>
          <h1>Olá, {firstName} 👋</h1>
          <p>Acompanhe a produção de conteúdo de {workspace.name}.</p>
        </div>
        <Link prefetch={false} className="cta" href="/create">＋ Criar conteúdo</Link>
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
            <Link prefetch={false} href="/calendar">Ver calendário →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="dashboardEmpty">
              <span>◎</span>
              <b>Nenhum conteúdo agendado ainda</b>
              <p>Os rascunhos já podem ser produzidos; o agendamento entra na próxima etapa.</p>
              <Link prefetch={false} href="/create">Criar conteúdo</Link>
            </div>
          ) : (
            upcoming.map((item) => (
              <Link prefetch={false} className="postRow" href={`/content/${item.id}`} key={item.id}>
                <div className="thumb">{item.type.slice(0, 1).toUpperCase()}</div>
                <div>
                  <em>{item.type.toUpperCase()}</em>
                  <b>{item.title}</b>
                  <small>{brandNames.get(item.brand_id) || "Marca"}</small>
                </div>
                <span>Agendado</span>
              </Link>
            ))
          )}
        </article>

        <article className="panel ai">
          <span className="eyebrow">ASSISTENTE IA</span>
          <h2>O que vamos criar hoje?</h2>
          <p>A IA já usa a memória da sua marca para gerar rascunhos estruturados.</p>
          <div className="aiReadyCard"><span>✦</span><div><b>Motor de conteúdo conectado</b><small>Carrossel, post e roteiro de Reel</small></div></div>
          <div className="promptFooter">
            <small>Marca principal: <b>{primaryBrand}</b></small>
            <Link prefetch={false} href="/create">Criar agora ✦</Link>
          </div>
        </article>
      </div>

      <div className="grid bottom">
        <article className="panel">
          <div className="panelHead">
            <div><h2>Marcas ativas</h2><p>Marcas cadastradas neste workspace</p></div>
            <Link prefetch={false} href="/brands">Gerenciar →</Link>
          </div>

          {brands.length === 0 ? (
            <div className="dashboardEmpty compact">
              <b>Nenhuma marca cadastrada.</b>
              <Link prefetch={false} href="/brands/new">Adicionar marca</Link>
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
                <div><strong>{contents.filter((item) => item.brand_id === brand.id).length}</strong><small>conteúdos</small></div>
              </div>
            ))
          )}
        </article>

        <article className="panel">
          <div className="panelHead">
            <div><h2>Fluxo de produção</h2><p>O que já está disponível</p></div>
          </div>
          <div className="setupItem"><span>✓</span><div><b>Memória da marca</b><small>Estratégia, voz, vocabulário e direção visual.</small></div><Link prefetch={false} href="/brands">Editar</Link></div>
          <div className="setupItem"><span>✓</span><div><b>Geração com IA</b><small>O rascunho é salvo na Biblioteca e pode ser editado.</small></div><Link prefetch={false} href="/create">Gerar</Link></div>
        </article>
      </div>
    </AppShell>
  );
}
