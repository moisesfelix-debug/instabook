import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getWorkspaceContext } from "@/lib/workspace-context";
import { generateContent } from "./actions";
import { SubmitButton } from "@/components/submit-button";
import { VisualFamilyPreview } from "@/components/visual-family-preview";
import { visualFamilies } from "@/lib/visual-families";

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
            <div className="creatorHero">
              <div>
                <span className="eyebrow">DIRETOR CRIATIVO IA</span>
                <h2>Monte a direção antes de gerar</h2>
                <p>Briefing, estrutura e família visual entram juntos na geração.</p>
              </div>
              <div className="creatorHeroSteps" aria-label="Fluxo de criação">
                <span><b>1</b> Ideia</span>
                <span><b>2</b> Estrutura</span>
                <span><b>3</b> Visual</span>
                <span><b>4</b> Gerar</span>
              </div>
            </div>

            <form action={generateContent}>
              <div className="createBasicsGrid">
                <label className="brandSelectField">Marca
                  <select name="brandId" required>
                    {brands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}
                  </select>
                </label>

                <label className="briefingField">Ideia ou briefing
                  <textarea
                    name="briefing"
                    required
                    minLength={8}
                    placeholder="Ex.: crie um carrossel mostrando 5 erros que restaurantes cometem ao tentar vender pelo Instagram."
                  />
                </label>
              </div>

              <div className="createQuickSettings">
                <fieldset className="radioGroup createSettingGroup">
                  <legend>Formato</legend>
                  <label><input type="radio" name="type" value="carousel" defaultChecked /><span>Carrossel</span></label>
                  <label><input type="radio" name="type" value="post" /><span>Post estático</span></label>
                  <label><input type="radio" name="type" value="reel" /><span>Roteiro de Reel</span></label>
                </fieldset>

                <fieldset className="radioGroup createSettingGroup">
                  <legend>Objetivo</legend>
                  <label><input type="radio" name="objective" value="educar" defaultChecked /><span>Educar</span></label>
                  <label><input type="radio" name="objective" value="engajar" /><span>Engajar</span></label>
                  <label><input type="radio" name="objective" value="leads" /><span>Gerar leads</span></label>
                  <label><input type="radio" name="objective" value="vender" /><span>Vender</span></label>
                </fieldset>
              </div>

              <div className="creativeBriefBlock">
                <div className="creativeBriefHead">
                  <div>
                    <span className="eyebrow">ESTRATÉGIA DO CARROSSEL</span>
                    <h3>Escolha antes de gerar</h3>
                  </div>
                  <small>Use “IA escolhe” para o modo rápido.</small>
                </div>

                <div className="strategyChoiceGrid">
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
                </div>

                <fieldset className="choiceFieldset familyFieldset">
                  <legend>Família visual</legend>
                  <div className="familySectionHead">
                    <p className="choiceHelper">Escolha pela aparência. Os exemplos abaixo simulam uma capa real no formato 4:5.</p>
                    <span>Você pode trocar depois</span>
                  </div>
                  <div className="familyChoiceGrid">
                    <label className="familyChoiceCard">
                      <input type="radio" name="visualFamily" value="auto" defaultChecked />
                      <span className="familyChoiceInner">
                        <VisualFamilyPreview family="auto" />
                        <span className="familyChoiceMeta">
                          <b>IA escolhe</b>
                          <small>O Diretor Criativo seleciona a família mais coerente com a pauta.</small>
                          <em>modo rápido</em>
                        </span>
                      </span>
                    </label>
                    {visualFamilies.map((item) => (
                      <label className="familyChoiceCard" key={item.id}>
                        <input type="radio" name="visualFamily" value={item.id} />
                        <span className="familyChoiceInner">
                          <VisualFamilyPreview family={item.id} />
                          <span className="familyChoiceMeta">
                            <b>{item.label}</b>
                            <small>{item.description}</small>
                            <em>{item.bestFor}</em>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <SubmitButton className="cta full" pendingLabel="Criando conteúdo + visuais...">Gerar conteúdo completo ✦</SubmitButton>
            </form>

            <p className="featureNote">A família visual orienta a copy, a composição e as imagens. Depois da geração, tudo continua editável.</p>
          </article>

        </div>
      )}
    </AppShell>
  );
}
