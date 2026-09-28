import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { deleteContent, updateContent } from "@/app/content/actions";
import { SubmitButton } from "@/components/submit-button";

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  review: "Em revisão",
  changes_requested: "Ajustes solicitados",
  approved: "Aprovado",
  scheduled: "Agendado",
  published: "Publicado",
  failed: "Falhou",
};

export default async function ContentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: content }, { data: slides }] = await Promise.all([
    supabase
      .from("contents")
      .select("id,brand_id,type,title,hook,caption,cta,hashtags,reel_script,briefing,objective,status,created_at")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("content_slides")
      .select("id,position,headline,body")
      .eq("content_id", id)
      .eq("workspace_id", workspace.id)
      .order("position"),
  ]);

  if (!content) notFound();

  const { data: brand } = await supabase
    .from("brands")
    .select("name")
    .eq("id", content.brand_id)
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  return (
    <AppShell>
      <header>
        <div>
          <span className="eyebrow">{content.type.toUpperCase()} • {brand?.name || "MARCA"}</span>
          <h1>{content.title}</h1>
          <p>{statusLabels[content.status] || content.status} • gerado como rascunho editável.</p>
        </div>
        <Link prefetch={false} className="secondaryBtn" href="/library">← Biblioteca</Link>
      </header>

      {query.saved && <div className="formAlert successAlert pageAlert">Alterações salvas.</div>}

      <form className="contentEditor" action={updateContent}>
        <input type="hidden" name="contentId" value={content.id} />
        <input type="hidden" name="slideIds" value={(slides || []).map((slide) => slide.id).join(",")} />

        <article className="panel editorMain">
          <div className="editorSection">
            <label>Título<input name="title" defaultValue={content.title} required /></label>
            <label>Hook<textarea name="hook" defaultValue={content.hook || ""} /></label>
          </div>

          {(slides || []).length > 0 && (
            <div className="editorSection">
              <h2>Slides</h2>
              <div className="slideEditorList">
                {(slides || []).map((slide) => (
                  <div className="slideEditor" key={slide.id}>
                    <span>{String(slide.position).padStart(2, "0")}</span>
                    <label>Headline<input name={`slideHeadline_${slide.id}`} defaultValue={slide.headline || ""} /></label>
                    <label>Texto<textarea name={`slideBody_${slide.id}`} defaultValue={slide.body || ""} /></label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {content.type === "reel" && (
            <div className="editorSection">
              <h2>Roteiro do Reel</h2>
              <textarea className="largeTextarea" name="reelScript" defaultValue={content.reel_script || ""} />
            </div>
          )}

          <div className="editorSection">
            <h2>Legenda</h2>
            <textarea className="largeTextarea" name="caption" defaultValue={content.caption || ""} />
            <label>CTA<textarea name="cta" defaultValue={content.cta || ""} /></label>
            <label>Hashtags<input name="hashtags" defaultValue={(content.hashtags || []).map((tag: string) => "#" + tag).join(" ")} /></label>
          </div>
        </article>

        <aside className="panel editorSide">
          <span className="eyebrow">WORKFLOW</span>
          <label>Status
            <select name="status" defaultValue={content.status}>
              <option value="draft">Rascunho</option>
              <option value="review">Em revisão</option>
              <option value="changes_requested">Ajustes solicitados</option>
              <option value="approved">Aprovado</option>
            </select>
          </label>
          <div className="editorBrief">
            <small>Briefing original</small>
            <p>{content.briefing || "Sem briefing salvo."}</p>
          </div>
          <SubmitButton className="cta full" pendingLabel="Salvando alterações...">Salvar alterações</SubmitButton>
        </aside>
      </form>

      <form className="deleteContentForm" action={deleteContent}>
        <input type="hidden" name="contentId" value={content.id} />
        <SubmitButton className="dangerBtn" pendingLabel="Excluindo...">Excluir conteúdo</SubmitButton>
      </form>
    </AppShell>
  );
}
