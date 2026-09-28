import { AppShell } from "@/components/app-shell";
import { createBrand } from "../actions";

export default async function NewBrandPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AppShell>
      <header>
        <div>
          <span className="eyebrow">PASSO 2 DE 2</span>
          <h1>Cadastre sua primeira marca</h1>
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
              <label>Cliente <span>(opcional)</span><input name="clientName" placeholder="Ex.: Restaurante Vila" /></label>
              <label>Segmento<input name="segment" placeholder="Ex.: Marketing, gastronomia..." /></label>
              <label>Instagram<input name="instagramHandle" placeholder="@suamarca" /></label>
            </div>
          </div>
          <div className="formSection">
            <h2>Direção de conteúdo</h2>
            <label>Público-alvo<textarea name="audience" placeholder="Quem a marca quer atingir?"></textarea></label>
            <label>Tom de voz<textarea name="tone" placeholder="Ex.: direto, didático, descontraído, premium..."></textarea></label>
          </div>
          <button className="cta" type="submit">Salvar marca e entrar no InstaBook →</button>
        </form>
      </article>
    </AppShell>
  );
}
