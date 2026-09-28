import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { generateContent } from "./actions";
import { SubmitButton } from "@/components/submit-button";

const archetypes = [
  { value: "auto", label: "IA escolhe", description: "Analisa o briefing e define a melhor estrutura." },
  { value: "checklist", label: "Checklist / Lista", description: "Erros, passos, dicas, frameworks e listas." },
  { value: "story", label: "Story / Case", description: "Problema, virada, solução e resultado." },
  { value: "comparison", label: "Comparação", description: "Antes/depois, mito/verdade, A x B." },
  { value: "authority", label: "Dados / Autoridade", description: "Insights, análise, evidências e tendências." },
  { value: "product", label: "Produto / Foto-led", description: "Produto, serviço, ambiente ou showcase." },
] as const;

const directions = [
  { value: "auto", label: "IA escolhe", description: "Combina a estrutura com o conteúdo." },
  { value: "editorial", label: "Editorial", description: "Headline forte e narrativa visual." },
  { value: "split", label: "Split", description: "Contraste, imagem + texto e comparações." },
  { value: "minimal", label: "Minimal", description: "Respiro, dados e sofisticação." },
] as const;

const visualStyles = [
  { value: "auto", label: "IA escolhe", description: "Seleciona o pack mais coerente com a pauta." },
  { value: "bold_performance", label: "Bold Performance", description: "Impacto, contraste e tipografia dominante." },
  { value: "clean_consulting", label: "Clean Consulting", description: "Grid rigoroso e aparência B2B premium." },
  { value: "human_editorial", label: "Human Editorial", description: "Fotografia e linguagem de revista." },
  { value: "zine_collage", label: "Zine / Collage", description: "Recortes, camadas e personalidade." },
  { value: "sensory_product", label: "Sensory Product", description: "Imagem protagonista e experiência visual." },
] as const;

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
          <p>Defina a estratégia e o estilo antes da IA gerar texto, imagens e composição.</p>
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
        <div className="creatorLayout guidedCreatorLayout">
          <article className="panel creatorForm guidedCreatorForm">
            <span className="eyebrow">DIRETOR CRIATIVO IA</span>
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

              <div className="creativeBriefBlock">
                <div className="creativeBriefHead">
                  <div>
                    <span className="eyebrow">ESTRATÉGIA DO CARROSSEL</span>
                    <h3>Escolha antes de gerar</h3>
                  </div>
                  <small>Use “IA escolhe” para o modo rápido.</small>
                </div>

                <fieldset className="choiceFieldset">
                  <legend>Arquétipo do conteúdo</legend>
                  <div className="choiceGrid choiceGridArchetype">
                    {archetypes.map((item) => (
                      <label className="choiceCard" key={item.value}>
                        <input type="radio" name="archetype" value={item.value} defaultChecked={item.value === "auto"} />
                        <span><b>{item.label}</b><small>{item.description}</small></span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="choiceFieldset">
                  <legend>Direção estrutural</legend>
                  <div className="choiceGrid choiceGridDirection">
                    {directions.map((item) => (
                      <label className="choiceCard" key={item.value}>
                        <input type="radio" name="artDirection" value={item.value} defaultChecked={item.value === "auto"} />
                        <span><b>{item.label}</b><small>{item.description}</small></span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="choiceFieldset">
                  <legend>Estilo visual</legend>
                  <div className="choiceGrid choiceGridStyle">
                    {visualStyles.map((item) => (
                      <label className="choiceCard styleChoiceCard" key={item.value}>
                        <input type="radio" name="visualStyle" value={item.value} defaultChecked={item.value === "auto"} />
                        <span><b>{item.label}</b><small>{item.description}</small></span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <SubmitButton className="cta full" pendingLabel="Criando conteúdo + visuais...">Gerar conteúdo completo ✦</SubmitButton>
            </form>

            <p className="featureNote">GPT-5.4 Mini cria a estratégia e o texto; o Recraft gera os visuais de apoio já orientados pelo estilo escolhido.</p>
          </article>

          <article className="panel previewPanel generatorIntro">
            <span className="eyebrow">NOVO FLUXO</span>
            <h2>O visual nasce junto com a ideia.</h2>
            <div className="generationFlow">
              <div><span>1</span><b>Briefing</b><small>Ideia, objetivo e marca.</small></div>
              <div><span>2</span><b>Estrutura</b><small>Checklist, story, comparação, autoridade ou produto.</small></div>
              <div><span>3</span><b>Estilo</b><small>Direção estrutural + Style Pack definidos antes da geração.</small></div>
              <div><span>4</span><b>Criação completa</b><small>Copy, slides e imagens são produzidos dentro da mesma intenção visual.</small></div>
            </div>
          </article>
        </div>
      )}
    </AppShell>
  );
}
