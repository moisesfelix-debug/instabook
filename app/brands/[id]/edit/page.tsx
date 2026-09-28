import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { updateBrand } from "@/app/brands/actions";

export default async function EditBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: brand }, { data: clients }] = await Promise.all([
    supabase
      .from("brands")
      .select("id,name,client_id,segment,instagram_handle,website,audience,tone")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("clients")
      .select("id,name")
      .eq("workspace_id", workspace.id)
      .order("name"),
  ]);

  if (!brand) notFound();

  return (
    <AppShell>
      <header>
        <div>
          <span className="eyebrow">CONFIGURAÇÃO DA MARCA</span>
          <h1>Editar {brand.name}</h1>
          <p>Esses dados serão usados como contexto para a criação com IA.</p>
        </div>
        <Link className="secondaryBtn" href="/brands">← Voltar</Link>
      </header>

      <article className="panel brandFormPanel">
        {query.error && <div className="formAlert errorAlert">{query.error}</div>}
        <form className="brandForm" action={updateBrand}>
          <input type="hidden" name="brandId" value={brand.id} />

          <div className="formSection">
            <h2>Informações principais</h2>
            <div className="formGrid">
              <label>Nome da marca<input name="brandName" defaultValue={brand.name} required /></label>
              <label>Segmento<input name="segment" defaultValue={brand.segment || ""} /></label>
              <label>Instagram<input name="instagramHandle" defaultValue={brand.instagram_handle || ""} placeholder="@suamarca" /></label>
              <label>Site<input name="website" type="url" defaultValue={brand.website || ""} placeholder="https://..." /></label>
              <label>Cliente
                <select name="clientId" defaultValue={brand.client_id || ""}>
                  <option value="">Sem cliente vinculado</option>
                  {(clients || []).map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="formSection">
            <h2>Direção de conteúdo</h2>
            <label>Público-alvo<textarea name="audience" defaultValue={brand.audience || ""} /></label>
            <label>Tom de voz<textarea name="tone" defaultValue={brand.tone || ""} /></label>
          </div>

          <button className="cta" type="submit">Salvar alterações</button>
        </form>
      </article>
    </AppShell>
  );
}
