import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { updateBrand, uploadBrandLogo } from "@/app/brands/actions";
import { SubmitButton } from "@/components/submit-button";

function listToText(value: string[] | null | undefined) {
  return (value || []).join(", ");
}

export default async function EditBrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; asset?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: brand }, { data: clients }, { data: guidelines }] = await Promise.all([
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
    supabase
      .from("brand_guidelines")
      .select("primary_color,secondary_color,default_cta,voice_notes,preferred_words,forbidden_words,content_pillars,value_proposition,visual_direction,logo_path")
      .eq("brand_id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
  ]);

  if (!brand) notFound();

  const logoUrl = guidelines?.logo_path
    ? supabase.storage.from("brand-assets").getPublicUrl(guidelines.logo_path).data.publicUrl
    : null;

  return (
    <AppShell>
      <header>
        <div>
          <span className="eyebrow">MEMÓRIA DA MARCA</span>
          <h1>Editar {brand.name}</h1>
          <p>Essas informações entram automaticamente no contexto usado pela IA.</p>
        </div>
        <Link className="secondaryBtn" href="/brands">← Voltar</Link>
      </header>

      {query.asset === "logo" && <div className="formAlert successAlert pageAlert">Logo atualizado.</div>}
      {query.error && <div className="formAlert errorAlert pageAlert">{query.error}</div>}

      <article className="panel assetPanel">
        <div className="assetPreview logoAssetPreview" style={logoUrl ? { backgroundImage: `url("${logoUrl}")` } : undefined}>
          {!logoUrl && <span>{brand.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span>}
        </div>
        <div className="assetCopy">
          <span className="eyebrow">LOGO DA MARCA</span>
          <h2>{logoUrl ? "Logo conectado ao estúdio visual" : "Adicione o logo da marca"}</h2>
          <p>PNG, JPG ou WebP de até 5 MB. O arquivo será usado automaticamente nas artes exportadas.</p>
        </div>
        <form className="assetUploadForm" action={uploadBrandLogo} encType="multipart/form-data">
          <input type="hidden" name="brandId" value={brand.id} />
          <input name="logoFile" type="file" accept="image/png,image/jpeg,image/webp" required />
          <SubmitButton className="secondaryBtn" pendingLabel="Enviando logo...">{logoUrl ? "Trocar logo" : "Enviar logo"}</SubmitButton>
        </form>
      </article>

      <article className="panel brandFormPanel">
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
            <h2>Estratégia e voz</h2>
            <label>Público-alvo<textarea name="audience" defaultValue={brand.audience || ""} placeholder="Quem queremos atingir?" /></label>
            <label>Tom de voz<textarea name="tone" defaultValue={brand.tone || ""} placeholder="Direto, didático, provocador, premium..." /></label>
            <label>Proposta de valor<textarea name="valueProposition" defaultValue={guidelines?.value_proposition || ""} placeholder="Por que essa marca importa e qual transformação entrega?" /></label>
            <label>Pilares de conteúdo<input name="contentPillars" defaultValue={listToText(guidelines?.content_pillars)} placeholder="Educação, prova social, bastidores, oferta" /></label>
            <label>CTA padrão<input name="defaultCta" defaultValue={guidelines?.default_cta || ""} placeholder="Ex.: Fale com nossa equipe pelo direct." /></label>
            <label>Observações de voz<textarea name="voiceNotes" defaultValue={guidelines?.voice_notes || ""} placeholder="Regras específicas de escrita, bordões, nível de formalidade..." /></label>
          </div>

          <div className="formSection">
            <h2>Vocabulário</h2>
            <div className="formGrid">
              <label>Palavras preferidas<input name="preferredWords" defaultValue={listToText(guidelines?.preferred_words)} placeholder="estratégia, crescimento, clareza" /></label>
              <label>Palavras proibidas<input name="forbiddenWords" defaultValue={listToText(guidelines?.forbidden_words)} placeholder="imperdível, revolucionário..." /></label>
            </div>
          </div>

          <div className="formSection">
            <h2>Direção visual</h2>
            <div className="colorGrid">
              <label>Cor principal<input className="colorInput" name="primaryColor" type="color" defaultValue={guidelines?.primary_color || "#6d4aff"} /></label>
              <label>Cor secundária<input className="colorInput" name="secondaryColor" type="color" defaultValue={guidelines?.secondary_color || "#171923"} /></label>
            </div>
            <label>Direção visual<textarea name="visualDirection" defaultValue={guidelines?.visual_direction || ""} placeholder="Ex.: minimalista, alto contraste, fotos gastronômicas quentes, títulos grandes..." /></label>
          </div>

          <SubmitButton pendingLabel="Salvando marca...">Salvar memória da marca</SubmitButton>
        </form>
      </article>
    </AppShell>
  );
}
