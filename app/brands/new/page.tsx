import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { createBrand } from "../actions";

export default async function NewBrandPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, workspace } = await getWorkspaceContext();
  const { data: clients } = await supabase
    .from("clients")
    .select("id,name")
    .eq("workspace_id", workspace.id)
    .order("name");

  return (
    <AppShell>
      <header>
        <div>
          <span className="eyebrow">NOVA MARCA</span>
          <h1>Cadastre uma marca</h1>
          <p>Quanto melhor a memória da marca, mais consistente será a geração com IA.</p>
        </div>
      </header>

      <article className="panel brandFormPanel">
        {params.error && <div className="formAlert errorAlert">{params.error}</div>}
        <form className="brandForm" action={createBrand}>
          <div className="formSection">
            <h2>Informações principais</h2>
            <div className="formGrid">
              <label>Nome da marca<input name="brandName" required placeholder="Ex.: SaborBoost" /></label>
              <label>Segmento<input name="segment" placeholder="Ex.: Marketing gastronômico" /></label>
              <label>Instagram<input name="instagramHandle" placeholder="@suamarca" /></label>
              <label>Site<input name="website" type="url" placeholder="https://..." /></label>
              <label>Cliente existente
                <select name="existingClientId" defaultValue="">
                  <option value="">Sem cliente vinculado</option>
                  {(clients || []).map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
                </select>
              </label>
              <label>Novo cliente <span>(opcional)</span><input name="clientName" placeholder="Crie um cliente junto com a marca" /></label>
            </div>
          </div>

          <div className="formSection">
            <h2>Estratégia e voz</h2>
            <label>Público-alvo<textarea name="audience" placeholder="Quem a marca quer atingir?" /></label>
            <label>Tom de voz<textarea name="tone" placeholder="Ex.: direto, didático, descontraído, premium..." /></label>
            <label>Proposta de valor<textarea name="valueProposition" placeholder="Qual transformação a marca entrega?" /></label>
            <label>Pilares de conteúdo<input name="contentPillars" placeholder="Educação, prova social, bastidores, oferta" /></label>
            <label>CTA padrão<input name="defaultCta" placeholder="Ex.: Chame no direct para saber mais." /></label>
            <label>Observações de voz<textarea name="voiceNotes" placeholder="Regras específicas de escrita e linguagem." /></label>
          </div>

          <div className="formSection">
            <h2>Vocabulário e visual</h2>
            <div className="formGrid">
              <label>Palavras preferidas<input name="preferredWords" placeholder="estratégia, clareza, resultado" /></label>
              <label>Palavras proibidas<input name="forbiddenWords" placeholder="imperdível, revolucionário..." /></label>
            </div>
            <div className="colorGrid">
              <label>Cor principal<input className="colorInput" name="primaryColor" type="color" defaultValue="#6d4aff" /></label>
              <label>Cor secundária<input className="colorInput" name="secondaryColor" type="color" defaultValue="#171923" /></label>
            </div>
            <label>Direção visual<textarea name="visualDirection" placeholder="Minimalista, alto contraste, títulos grandes..." /></label>
          </div>

          <button className="cta" type="submit">Salvar marca</button>
        </form>
      </article>
    </AppShell>
  );
}
