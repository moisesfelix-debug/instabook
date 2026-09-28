import { AppShell } from "@/components/app-shell";

const formats = ["Carrossel", "Post estático", "Roteiro de Reel"];
const objectives = ["Educar", "Engajar", "Gerar leads", "Vender"];

export default function CreatePage() {
  return (
    <AppShell>
      <header><div><h1>Criar conteúdo</h1><p>Transforme uma ideia em conteúdo alinhado à identidade da marca.</p></div></header>
      <div className="creatorLayout">
        <article className="panel creatorForm">
          <span className="eyebrow">ASSISTENTE IA</span>
          <h2>Conte o que você quer publicar</h2>
          <label>Marca<select><option>SaborBoost</option><option>Restaurante Vila</option><option>Clínica Aurora</option></select></label>
          <label>Ideia ou briefing<textarea placeholder="Ex.: crie um carrossel sobre 5 erros que restaurantes cometem no Instagram."/></label>
          <div className="choiceGroup"><span>Formato</span>{formats.map((x,i)=><button className={i===0?"choice activeChoice":"choice"} key={x}>{x}</button>)}</div>
          <div className="choiceGroup"><span>Objetivo</span>{objectives.map((x,i)=><button className={i===0?"choice activeChoice":"choice"} key={x}>{x}</button>)}</div>
          <button className="cta full">Gerar conteúdo ✦</button>
        </article>
        <article className="panel previewPanel">
          <div className="panelHead"><div><h2>Prévia</h2><p>Carrossel • 7 slides • 1080 × 1350</p></div><span className="draftBadge">Rascunho</span></div>
          <div className="carouselPreview"><small>SABORBOOST</small><h3>5 erros que estão afastando clientes do seu Instagram</h3><p>Deslize para descobrir →</p><b>01/07</b></div>
          <div className="slideStrip">{[1,2,3,4,5,6,7].map(n=><button className={n===1?"slide activeSlide":"slide"} key={n}>{n}</button>)}</div>
          <div className="previewActions"><button>Editar design</button><button>Salvar rascunho</button><button className="primaryGhost">Adicionar ao calendário</button></div>
        </article>
      </div>
    </AppShell>
  );
}
