import { AppShell } from "@/components/app-shell";

const brands=[["Restaurante Vila","Gastronomia","@restaurantevila","28 conteúdos"],["SaborBoost","Marketing","@saborboost","42 conteúdos"],["Clínica Aurora","Saúde & estética","@clinicaaurora","19 conteúdos"]];

export default function BrandsPage(){
 return <AppShell><header><div><h1>Marcas & clientes</h1><p>Identidade, estratégia e canais usados pela IA em cada conteúdo.</p></div><button className="cta">＋ Nova marca</button></header>
 <div className="brandCards">{brands.map(([name,segment,handle,count],i)=><article className="panel brandCard" key={name}><div className={"bigBrand b"+i}>{name.split(" ").map(x=>x[0]).slice(0,2).join("")}</div><div><small>{segment}</small><h2>{name}</h2><p>{handle}</p></div><div className="brandStats"><span><b>{count.split(" ")[0]}</b><small>conteúdos</small></span><span><b>{["5,6%","4,9%","3,8%"][i]}</b><small>engajamento</small></span></div><button className="secondaryBtn">Abrir marca</button></article>)}</div>
 </AppShell>
}
