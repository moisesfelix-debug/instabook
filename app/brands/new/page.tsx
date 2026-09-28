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
          <p>Essas informações vão orientar a IA na criação dos conteúdos.</p>
        </div>
      </header>

      <article className="panel brandFormPanel">
        {params.error && <div className="formAlert errorAlert">{params.error}</div>}
        <form className="brandForm" action={createBrand}>
          <div className="formSection">
            <h2>Marca</h2>
            <div className="formGrid">
              <label>Nome da marca<input name="brandName" required placeholder="Ex.: SaborBoost" /></label>
              <label>Segmento<input name="segment" placeholder="Ex.: Marketing, gastronomia..." /></label>
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
            <h2>Direção de conteúdo</h2>
            <label>Público-alvo<textarea name="audience" placeholder="Quem a marca quer atingir?"></textarea></label>
            <label>Tom de voz<textarea name="tone" placeholder="Ex.: direto, didático, descontraído, premium..."></textarea></label>
          </div>
          <button className="cta" type="submit">Salvar marca</button>
        </form>
      </article>
    </AppShell>
  );
}
