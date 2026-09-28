import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { generateContent } from "./actions";

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const query = await searchParams;
  const { supabase, workspace } = await getWorkspaceContext();
  const { data: brands } = await supabase
    .from("brands")
    .select("id,name")
    .eq("workspace_id", workspace.id)
    .order("created_at");

  return (
    <AppShell>
      <header>
        <div>
          <h1>Criar conteúdo</h1>
          <p>Briefing + identidade da marca + IA, salvo automaticamente como rascunho.</p>
        </div>
        <Link prefetch={false} className="secondaryBtn" href="/library">Ver biblioteca</Link>
      </header>

      {query.error && <div className="formAlert errorAlert pageAlert">{query.error}</div>}

      {(!brands || brands.length === 0) ? (
        <article className="panel emptyState">
          <span className="emptyIcon">✦</span>
          <h2>Cadastre uma marca antes de criar</h2>
          <p>A IA usa a identidade da marca como contexto para gerar os conteúdos.</p>
          <Link prefetch={false} className="cta" href="/brands/new">Cadastrar marca</Link>
        </article>
      ) : (
        <div className="creatorLayout">
          <article className="panel creatorForm">
            <span className="eyebrow">ASSISTENTE IA</span>
            <h2>O que vamos criar?</h2>
            <form action={generateContent}>
              <label>Marca
                <select name="brandId" required>
                  {brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
                </select>
              </label>

              <label>Ideia ou briefing
                <textarea
                  name="briefing"
                  required
                  minLength={8}
                  placeholder="Ex.: crie um carrossel mostrando 5 erros que restaurantes cometem ao tentar vender pelo Instagram."
                />
              </label>

              <fieldset className="radioGroup">
                <legend>Formato</legend>
                <label><input type="radio" name="type" value="carousel" defaultChecked /><span>Carrossel</span></label>
                <label><input type="radio" name="type" value="post" /><span>Post estático</span></label>
                <label><input type="radio" name="type" value="reel" /><span>Roteiro de Reel</span></label>
              </fieldset>

              <fieldset className="radioGroup">
                <legend>Objetivo</legend>
                <label><input type="radio" name="objective" value="educar" defaultChecked /><span>Educar</span></label>
                <label><input type="radio" name="objective" value="engajar" /><span>Engajar</span></label>
                <label><input type="radio" name="objective" value="leads" /><span>Gerar leads</span></label>
                <label><input type="radio" name="objective" value="vender" /><span>Vender</span></label>
              </fieldset>

              <button className="cta full" type="submit">Gerar e salvar rascunho ✦</button>
            </form>
            <p className="featureNote">A primeira versão usa GPT-5.4 Mini via Vercel AI Gateway para equilibrar qualidade e custo.</p>
          </article>

          <article className="panel previewPanel generatorIntro">
            <span className="eyebrow">COMO FUNCIONA</span>
            <h2>A marca vira contexto, não só um nome.</h2>
            <div className="generationFlow">
              <div><span>1</span><b>Briefing</b><small>Você informa a ideia e objetivo.</small></div>
              <div><span>2</span><b>Identidade</b><small>Público, tom, pilares, palavras e CTA entram no prompt.</small></div>
              <div><span>3</span><b>IA</b><small>O conteúdo é gerado de forma estruturada.</small></div>
              <div><span>4</span><b>Rascunho</b><small>Slides, legenda e roteiro ficam salvos para edição.</small></div>
            </div>
          </article>
        </div>
      )}
    </AppShell>
  );
}
