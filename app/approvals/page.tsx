import { AppShell } from "@/components/app-shell";

const approvals=[["5 erros que afastam clientes do Instagram","Restaurante Vila","Carrossel","Aguardando cliente"],["Como escolher o melhor procedimento?","Clínica Aurora","Carrossel","Revisão interna"],["Checklist antes de publicar","SaborBoost","Post","Aguardando gestor"]];

export default function ApprovalsPage(){
 return <AppShell><header><div><h1>Aprovações</h1><p>Central de revisão para equipe e clientes.</p></div></header>
 <article className="panel"><div className="approvalTabs"><button className="activeTab">Pendentes <span>3</span></button><button>Aprovados</button><button>Alterações solicitadas</button></div>
 {approvals.map(([title,brand,type,status],i)=><div className="approvalRow" key={title}><div className={"approvalThumb cover"+i}>{type[0]}</div><div><small>{type} • {brand}</small><b>{title}</b><span>{status}</span></div><div className="approvalActions"><button>Ver conteúdo</button><button>Solicitar ajuste</button><button className="approve">Aprovar</button></div></div>)}</article>
 </AppShell>
}
