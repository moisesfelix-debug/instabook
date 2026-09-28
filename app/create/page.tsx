import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";

const formats = ["Carrossel", "Post estático", "Roteiro de Reel"];
const objectives = ["Educar", "Engajar", "Gerar leads", "Vender"];

export default async function CreatePage() {
  const { supabase, workspace } = await getWorkspaceContext();
  const { data: brands } = await supabase
    .from("brands")
    .select("id,name")
    .eq("workspace_id", workspace.id)
    .order("created_at");

  const firstBrand = brands?.[0]?.name || "Sua marca";

  return (
    <AppShell>
      <header><div><h1>Criar conteúdo</h1><p>Transforme uma ideia em conteúdo alinhado à identidade da marca.</p></div></header>
      <div className="creatorLayout">
        <article className="panel creatorForm">
          <span className="eyebrow">ASSISTENTE IA</span>
          <h2>Conte o que você quer publicar</h2>
          <label>Marca
            <select>
              {(brands || []).map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
              {(!brands || brands.length === 0) && <option>Cadastre uma marca primeiro</option>}
            </select>
          </label>
          <label>Ideia ou briefing<textarea placeholder="Ex.: crie um carrossel sobre 5 erros que restaurantes cometem no Instagram."/></label>
          <div className="choiceGroup"><span>Formato</span>{formats.map((x,i)=><button type="button" className={i===0?"choice activeChoice":"choice"} key={x}>{x}</button>)}</div>
          <div className="choiceGroup"><span>Objetivo</span>{objectives.map((x,i)=><button type="button" className={i===0?"choice activeChoice":"choice"} key={x}>{x}</button>)}</div>
          <button className="cta full" type="button">Gerar conteúdo ✦</button>
          <p className="featureNote">A geração por IA será conectada na próxima etapa. A marca selecionada já vem do banco real.</p>
        </article>
        <article className="panel previewPanel">
          <div className="panelHead"><div><h2>Prévia</h2><p>Modelo de carrossel • 1080 × 1350</p></div><span className="draftBadge">Exemplo</span></div>
          <div className="carouselPreview"><small>{firstBrand.toUpperCase()}</small><h3>Seu conteúdo gerado aparecerá aqui</h3><p>Briefing + identidade da marca + IA →</p><b>01/07</b></div>
          <div className="slideStrip">{[1,2,3,4,5,6,7].map(n=><button type="button" className={n===1?"slide activeSlide":"slide"} key={n}>{n}</button>)}</div>
        </article>
      </div>
    </AppShell>
  );
}
