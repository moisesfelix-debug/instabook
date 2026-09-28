import { AppShell } from "@/components/app-shell";

const content=[["Carrossel","5 erros que afastam clientes","Restaurante Vila","Agendado"],["Post","Checklist antes de publicar","SaborBoost","Rascunho"],["Reel","3 maneiras de melhorar alcance","Clínica Aurora","Em aprovação"],["Carrossel","Como transformar seguidores em clientes","SaborBoost","Publicado"],["Post","Bastidores que geram confiança","Restaurante Vila","Publicado"],["Carrossel","Guia rápido de posicionamento","Clínica Aurora","Rascunho"]];

export default function LibraryPage(){
  return <AppShell><header><div><h1>Biblioteca</h1><p>Todos os conteúdos produzidos no workspace.</p></div><button className="cta">＋ Criar conteúdo</button></header>
  <div className="toolbar"><input placeholder="Buscar conteúdo..."/><select><option>Todas as marcas</option></select><select><option>Todos os status</option></select></div>
  <div className="libraryGrid">{content.map(([type,title,brand,status],i)=><article className="contentCard" key={title}><div className={"contentCover cover"+i}><span>{type}</span><b>{i%2===0?"DICA":"GUIA"}</b></div><div className="contentMeta"><small>{brand}</small><h3>{title}</h3><span>{status}</span></div></article>)}</div>
  </AppShell>
}
