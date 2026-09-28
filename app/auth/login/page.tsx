import Link from "next/link";
import { signIn } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="authPage">
      <section className="authBrand">
        <div className="authLogo"><span>IB</span><b>InstaBook</b></div>
        <div>
          <span className="eyebrow light">CONTEÚDO + IA + OPERAÇÃO</span>
          <h1>Planeje, crie e publique conteúdo em escala.</h1>
          <p>Uma única plataforma para marcas, profissionais e agências.</p>
        </div>
      </section>

      <section className="authFormWrap">
        <form className="authForm" action={signIn}>
          <div>
            <span className="eyebrow">BEM-VINDO DE VOLTA</span>
            <h2>Entrar no InstaBook</h2>
            <p>Acesse seu workspace para continuar.</p>
          </div>
          {params.error && <div className="formAlert errorAlert">{params.error}</div>}
          {params.message && <div className="formAlert successAlert">{params.message}</div>}
          <label>E-mail<input name="email" type="email" autoComplete="email" required placeholder="voce@empresa.com" /></label>
          <label>Senha<input name="password" type="password" autoComplete="current-password" required placeholder="••••••••" /></label>
          <button className="cta full" type="submit">Entrar</button>
          <p className="authSwitch">Ainda não tem conta? <Link href="/auth/register">Criar conta</Link></p>
        </form>
      </section>
    </main>
  );
}
