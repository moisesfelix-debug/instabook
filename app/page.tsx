import Link from "next/link";
import { AppShell } from "@/components/app-shell";

const cards = [
  ["Conteúdos este mês", "42", "+18% vs. agosto"],
  ["Agendados", "16", "próximos 14 dias"],
  ["Publicados", "31", "97% sem falhas"],
  ["Engajamento médio", "4,8%", "+0,7 p.p."]
];

const brands = [
  ["Restaurante Vila", "@restaurantevila", "5,6%"],
  ["SaborBoost", "@saborboost", "4,9%"],
  ["Clínica Aurora", "@clinicaaurora", "3,8%"]
];

export default function Home() {
  return (
    <AppShell>
      <header><div><h1>Bom dia, Moisés 👋</h1><p>Acompanhe a produção de conteúdo das suas marcas.</p></div><Link className="cta" href="/create">＋ Criar conteúdo</Link></header>
      <div className="metrics">{cards.map(([label,value,foot])=><article key={label}><small>{label}</small><strong>{value}</strong><span>{foot}</span></article>)}</div>
      <div className="grid">
        <article className="panel large"><div className="panelHead"><div><h2>Próximos conteúdos</h2><p>Agenda da semana</p></div><Link href="/calendar">Ver calendário →</Link></div>
          <div className="week">{[["SEG","28"],["TER","29"],["QUA","30"],["QUI","01"],["SEX","02"],["SÁB","03"],["DOM","04"]].map(([d,n],i)=><div className={i===1?"selected":""} key={d}><small>{d}</small><b>{n}</b></div>)}</div>
          {[["CARROSSEL","5 erros que afastam clientes do seu Instagram","Restaurante Vila • Hoje, 19:00"],["POST","Checklist antes de publicar um conteúdo","SaborBoost • Amanhã, 12:30"],["REEL","Como aumentar o alcance sem aumentar o orçamento","Clínica Aurora • Quinta, 18:00"]].map(([type,title,meta])=><div className="postRow" key={title}><div className="thumb">{type.slice(0,1)}</div><div><em>{type}</em><b>{title}</b><small>{meta}</small></div><span>Agendado</span></div>)}
        </article>
        <article className="panel ai"><span className="eyebrow">ASSISTENTE IA</span><h2>O que vamos criar hoje?</h2><p>Transforme uma ideia simples em conteúdo pronto para publicar.</p><textarea placeholder="Ex.: Crie um carrossel com 7 slides sobre como aumentar as vendas de um restaurante pelo Instagram..."/><div className="promptFooter"><small>Marca: <b>SaborBoost</b></small><Link href="/create">Gerar ✦</Link></div></article>
      </div>
      <div className="grid bottom">
        <article className="panel"><div className="panelHead"><div><h2>Marcas ativas</h2><p>Performance nos últimos 30 dias</p></div><Link href="/brands">Gerenciar →</Link></div>{brands.map(([name,handle,eng],i)=><div className="brandRow" key={name}><span className={"brandIcon b"+i}>{name.split(" ").map(x=>x[0]).slice(0,2).join("")}</span><div><b>{name}</b><small>{handle}</small></div><div><strong>{eng}</strong><small>engajamento</small></div></div>)}</article>
        <article className="panel"><div className="panelHead"><div><h2>Radar de oportunidades</h2><p>Ideias sugeridas para suas marcas</p></div></div><div className="idea"><span>92</span><div><b>“3 coisas que ninguém te conta sobre...”</b><small>Formato em alta • Carrossel educativo</small></div><Link href="/create">Usar ideia</Link></div><div className="idea"><span>87</span><div><b>Antes x Depois: mostre transformação</b><small>Boa aderência • Prova social</small></div><Link href="/create">Usar ideia</Link></div></article>
      </div>
    </AppShell>
  );
}
