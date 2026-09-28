import { AppShell } from "@/components/app-shell";

export default function AnalyticsPage(){
 const bars=[46,68,58,82,64,91,74,88,71,96,79,93];
 return <AppShell><header><div><h1>Analytics</h1><p>Performance de conteúdo consolidada por marca.</p></div><select className="headerSelect"><option>Últimos 30 dias</option></select></header>
 <div className="metrics">{[["Alcance","184,2 mil","+23%"],["Engajamentos","9.842","+18%"],["Salvamentos","2.416","+31%"],["Novos seguidores","1.204","+14%"]].map(x=><article key={x[0]}><small>{x[0]}</small><strong>{x[1]}</strong><span>{x[2]}</span></article>)}</div>
 <div className="analyticsGrid"><article className="panel"><div className="panelHead"><div><h2>Alcance por conteúdo</h2><p>Evolução nas últimas publicações</p></div></div><div className="barChart">{bars.map((h,i)=><div key={i}><i style={{height:h+"%"}}></i><small>{i+1}</small></div>)}</div></article>
 <article className="panel"><div className="panelHead"><div><h2>O que está funcionando</h2><p>Aprendizados detectados</p></div></div>{[["+37%","Carrosséis em formato de lista geram mais salvamentos."],["+22%","Hooks em forma de pergunta ampliam o alcance."],["2,1×","Conteúdo educativo é mais compartilhado que promocional."]].map(([n,t])=><div className="insight" key={t}><strong>{n}</strong><p>{t}</p></div>)}</article></div>
 </AppShell>
}
