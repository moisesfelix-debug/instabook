import { createWorkspace } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="onboardingPage">
      <section className="onboardingCard">
        <div className="onboardingStep">1 de 2</div>
        <span className="eyebrow">CONFIGURAÇÃO INICIAL</span>
        <h1>Como você vai usar o InstaBook?</h1>
        <p>Isso adapta a estrutura do workspace. Você poderá alterar membros e marcas depois.</p>

        {params.error && <div className="formAlert errorAlert">{params.error}</div>}

        <form action={createWorkspace}>
          <label>Nome do workspace<input name="workspaceName" required placeholder="Ex.: SaborBoost" /></label>
          <div className="workspaceTypes">
            <label><input type="radio" name="workspaceType" value="creator" defaultChecked /><span><b>Empresa / Creator</b><small>Uma ou poucas marcas próprias.</small></span></label>
            <label><input type="radio" name="workspaceType" value="professional" /><span><b>Profissional / Freelancer</b><small>Gerencie várias marcas sozinho.</small></span></label>
            <label><input type="radio" name="workspaceType" value="agency" /><span><b>Agência</b><small>Clientes, equipe, aprovações e visão consolidada.</small></span></label>
          </div>
          <button className="cta full" type="submit">Continuar para a primeira marca →</button>
        </form>
      </section>
    </main>
  );
}
