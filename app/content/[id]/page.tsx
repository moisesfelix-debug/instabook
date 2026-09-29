import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { applyComparisonVisual, compareImageModels, deleteContent, generateCarouselVisuals, updateContent, uploadContentHero } from "@/app/content/actions";
import { SubmitButton } from "@/components/submit-button";
import { VisualCarousel } from "@/components/visual-carousel";
import { ModelComparisonSlide } from "@/components/model-comparison-slide";

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
  searchParams: Promise<{ saved?: string; error?: string; asset?: string; generated?: string; compare?: string; compared?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const { supabase, workspace } = await getWorkspaceContext();

  const [{ data: content }, { data: slides }] = await Promise.all([
    supabase
      .from("contents")
      .select("id,brand_id,type,title,hook,caption,cta,hashtags,reel_script,briefing,objective,status,created_at,hero_image_path,content_archetype,art_direction,visual_style,visual_family")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("content_slides")
      .select("id,position,headline,body,slide_role,emphasis,visual_priority,badge,highlight,secondary_headline,secondary_body,image_path,image_prompt")
      .eq("content_id", id)
      .eq("workspace_id", workspace.id)
      .order("position"),
  ]);

  if (!content) notFound();

  const [{ data: brand }, { data: visualGuidelines }] = await Promise.all([
    supabase
      .from("brands")
      .select("name")
      .eq("id", content.brand_id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
    supabase
      .from("brand_guidelines")
      .select("primary_color,secondary_color,logo_path")
      .eq("brand_id", content.brand_id)
      .eq("workspace_id", workspace.id)
      .maybeSingle(),
  ]);

  const logoUrl = visualGuidelines?.logo_path
    ? supabase.storage.from("brand-assets").getPublicUrl(visualGuidelines.logo_path).data.publicUrl
    : null;

  let heroImageUrl: string | null = null;
  if (content.hero_image_path) {
    const { data: signedImage } = await supabase.storage
      .from("content-assets")
      .createSignedUrl(content.hero_image_path, 60 * 60 * 6);
    heroImageUrl = signedImage?.signedUrl || null;
  }

  const visualSlides = await Promise.all(
    (slides || []).map(async (slide) => {
      if (!slide.image_path) return { ...slide, image_url: null };
      const { data } = await supabase.storage
        .from("content-assets")
        .createSignedUrl(slide.image_path, 60 * 60 * 6);
      return { ...slide, image_url: data?.signedUrl || null };
    })
  );

  const generatedVisualCount = visualSlides.filter((slide) => Boolean(slide.image_url)).length;

  const { data: latestComparison } = await supabase
    .from("content_visual_comparisons")
    .select("batch_id")
    .eq("content_id", content.id)
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let comparisonVisuals: Array<{
    id: string;
    label: string;
    model: string;
    image_url: string | null;
  }> = [];

  if (latestComparison?.batch_id) {
    const { data: comparisons } = await supabase
      .from("content_visual_comparisons")
      .select("id,label,model,image_path")
      .eq("content_id", content.id)
      .eq("workspace_id", workspace.id)
      .eq("batch_id", latestComparison.batch_id)
      .order("created_at");

    comparisonVisuals = await Promise.all(
      (comparisons || []).map(async (item) => {
        const { data } = await supabase.storage
          .from("content-assets")
          .createSignedUrl(item.image_path, 60 * 60 * 6);
        return {
          id: item.id,
          label: item.label,
          model: item.model,
          image_url: data?.signedUrl || null,
        };
      })
    );
  }

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
      {query.asset === "hero" && <div className="formAlert successAlert pageAlert">Imagem do conteúdo atualizada.</div>}
      {query.asset === "ai" && <div className="formAlert successAlert pageAlert">{query.generated || "0"} visuais regenerados com IA.</div>}
      {query.asset === "comparison" && <div className="formAlert successAlert pageAlert">Imagem da comparação aplicada ao slide.</div>}
      {query.compare && <div className="formAlert successAlert pageAlert">{query.compared || "0"} modelo(s) concluíram a comparação.</div>}
      {query.asset === "auto" && Number(query.generated || 0) > 0 && (
        <div className="formAlert successAlert pageAlert">Conteúdo criado com {query.generated} visuais gerados automaticamente.</div>
      )}
      {query.asset === "auto" && Number(query.generated || 0) === 0 && (
        <div className="formAlert errorAlert pageAlert">O conteúdo foi criado, mas os visuais automáticos não ficaram prontos. Você pode regenerá-los abaixo.</div>
      )}
      {query.error && <div className="formAlert errorAlert pageAlert">{query.error}</div>}

      {(slides || []).length > 0 && (
        <article className="panel assetPanel contentAssetPanel">
          <div
            className="assetPreview contentAssetPreview"
            style={heroImageUrl ? { backgroundImage: `url("${heroImageUrl}")` } : undefined}
          >
            {!heroImageUrl && <span>IMG</span>}
          </div>
          <div className="assetCopy">
            <span className="eyebrow">IMAGEM DO CONTEÚDO</span>
            <h2>{heroImageUrl ? "Imagem conectada aos templates" : "Adicione uma foto de apoio"}</h2>
            <p>Use uma foto do produto, ambiente, pessoa ou campanha. Ela permanece privada e entra no preview e no PNG.</p>
          </div>
          <form className="assetUploadForm" action={uploadContentHero} encType="multipart/form-data">
            <input type="hidden" name="contentId" value={content.id} />
            <input name="heroFile" type="file" accept="image/png,image/jpeg,image/webp" required />
            <SubmitButton className="secondaryBtn" pendingLabel="Enviando imagem...">{heroImageUrl ? "Trocar imagem" : "Enviar imagem"}</SubmitButton>
          </form>
        </article>
      )}

      {(slides || []).length > 0 && (
        <article className="panel aiVisualPanel">
          <div>
            <span className="eyebrow">VISUAIS POR SLIDE</span>
            <h2>{generatedVisualCount > 0 ? "Regenerar imagens com IA" : "Gerar imagens com IA"}</h2>
            <p>{generatedVisualCount > 0
              ? `${generatedVisualCount} visual(is) já estão conectados. Use esta opção se quiser novas versões para os slides estratégicos.`
              : "O Diretor de Arte escolhe até 3 slides estratégicos e cria visuais diferentes para cada um, preservando o texto no nosso motor gráfico."}</p>
          </div>
          <form action={generateCarouselVisuals}>
            <input type="hidden" name="contentId" value={content.id} />
            <SubmitButton className="cta" pendingLabel="Criando visuais...">{generatedVisualCount > 0 ? "Regenerar visuais ✦" : "Gerar visuais com IA ✦"}</SubmitButton>
          </form>
        </article>
      )}

      {(slides || []).length > 0 && (
        <article className="panel modelComparePanel">
          <div className="modelCompareHead">
            <div>
              <span className="eyebrow">LAB DE IMAGEM</span>
              <h2>Comparar modelos no mesmo slide</h2>
              <p>Compara a capa final completa: mesma copy, mesma família e mesmo layout. Só o modelo que gera a imagem muda entre Recraft V4.1, Recraft V4.1 Pro e GPT Image 2.5 Flare.</p>
            </div>
            <form action={compareImageModels}>
              <input type="hidden" name="contentId" value={content.id} />
              <SubmitButton className="secondaryBtn" pendingLabel="Comparando modelos...">Gerar comparação A/B/C</SubmitButton>
            </form>
          </div>

          {comparisonVisuals.length > 0 && (
            <div className="modelCompareGrid">
              {comparisonVisuals.map((item) => (
                <article className="modelCompareCard" key={item.id}>
                  <div className="modelComparePost">
                    <ModelComparisonSlide
                      brandName={brand?.name || "Marca"}
                      primaryColor={visualGuidelines?.primary_color}
                      secondaryColor={visualGuidelines?.secondary_color}
                      logoUrl={logoUrl}
                      artDirection={content.art_direction}
                      visualStyle={content.visual_style}
                      visualFamily={content.visual_family}
                      slide={(slides || [])[0]}
                      totalSlides={(slides || []).length}
                      imageUrl={item.image_url}
                    />
                  </div>
                  <div className="modelCompareMeta">
                    <div>
                      <b>{item.label}</b>
                      <small>{item.model}</small>
                    </div>
                    <form action={applyComparisonVisual}>
                      <input type="hidden" name="contentId" value={content.id} />
                      <input type="hidden" name="comparisonId" value={item.id} />
                      <SubmitButton className="secondaryBtn" pendingLabel="Aplicando...">Usar esta</SubmitButton>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      )}

      {(slides || []).length > 0 && (
        <VisualCarousel
          brandName={brand?.name || "Marca"}
          primaryColor={visualGuidelines?.primary_color}
          secondaryColor={visualGuidelines?.secondary_color}
          logoUrl={logoUrl}
          heroImageUrl={heroImageUrl}
          contentArchetype={content.content_archetype}
          artDirection={content.art_direction}
          visualStyle={content.visual_style}
          visualFamily={content.visual_family}
          slides={visualSlides}
        />
      )}

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
                    <small className="slideRoleTag">{String(slide.slide_role || "body").replace("_", " ")}</small>
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
