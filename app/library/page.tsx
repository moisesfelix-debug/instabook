import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";

const typeLabels: Record<string, string> = {
  carousel: "Carrossel",
  post: "Post",
  reel: "Reel",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  changes_requested: "Ajustes",
  approved: "Aprovado",
  scheduled: "Agendado",
  published: "Publicado",
  failed: "Falhou",
};

export default async function LibraryPage() {
  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: contents }, { data: brands }] = await Promise.all([
    supabase
      .from("contents")
      .select("id,brand_id,type,title,status,created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("brands")
      .select("id,name")
      .eq("workspace_id", workspace.id),
  ]);

  const brandNames = new Map((brands || []).map((brand) => [brand.id, brand.name] as const));

  return (
    <AppShell>
      <header>
        <div><h1>Biblioteca</h1><p>Todos os rascunhos e conteúdos produzidos neste workspace.</p></div>
        <Link className="cta" href="/create">＋ Criar conteúdo</Link>
      </header>

      {!contents || contents.length === 0 ? (
        <article className="panel emptyState">
          <span className="emptyIcon">▦</span>
          <h2>A biblioteca ainda está vazia</h2>
          <p>Gere o primeiro conteúdo com IA e ele será salvo aqui automaticamente.</p>
          <Link className="cta" href="/create">Criar primeiro conteúdo</Link>
        </article>
      ) : (
        <div className="libraryGrid">
          {contents.map((content, i) => (
            <Link className="contentCard" href={`/content/${content.id}`} key={content.id}>
              <div className={"contentCover cover" + (i % 6)}>
                <span>{typeLabels[content.type] || content.type}</span>
                <b>{content.type === "carousel" ? "7×" : content.type === "reel" ? "▶" : "1×"}</b>
              </div>
              <div className="contentMeta">
                <small>{brandNames.get(content.brand_id) || "Marca"}</small>
                <h3>{content.title}</h3>
                <span>{statusLabels[content.status] || content.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
