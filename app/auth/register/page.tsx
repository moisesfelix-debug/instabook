import Link from "next/link";
import { signUp } from "../actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="authPage">
      <section className="authBrand">
        <div className="authLogo"><span>IB</span><b>InstaBook</b></div>
        <div>
          <span className="eyebrow light">COMECE PELO SEU WORKSPACE</span>
          <h1>Seu motor de conteúdo para Instagram.</h1>
          <p>Organize marcas, equipe, calendário, aprovações e produção com IA.</p>
        </div>
      </section>

      <section className="authFormWrap">
        <form className="authForm" action={signUp}>
          <div>
            <span className="eyebrow">CRIAR CONTA</span>
            <h2>Comece no InstaBook</h2>
            <p>Você configura seu workspace logo depois.</p>
          </div>
          {params.error && <div className="formAlert errorAlert">{params.error}</div>}
          <label>Nome<input name="fullName" required placeholder="Seu nome" /></label>
          <label>E-mail<input name="email" type="email" autoComplete="email" required placeholder="voce@empresa.com" /></label>
          <label>Senha<input name="password" type="password" minLength={8} autoComplete="new-password" required placeholder="Mínimo de 8 caracteres" /></label>
          <button className="cta full" type="submit">Criar minha conta</button>
          <p className="authSwitch">Já possui conta? <Link href="/auth/login">Entrar</Link></p>
        </form>
      </section>
    </main>
  );
}
