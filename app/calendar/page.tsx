import { AppShell } from "@/components/app-shell";

const days = Array.from({length:35},(_,i)=>i-1);
const posts: Record<number,string[]> = {2:["Carrossel • Vila"],5:["Post • SaborBoost"],9:["Reel • Aurora"],15:["Carrossel • Vila","Post • SaborBoost"],22:["Reel • Aurora"],27:["Post • SaborBoost"]};

export default function CalendarPage(){
  return <AppShell>
    <header><div><h1>Calendário editorial</h1><p>Planeje e acompanhe conteúdos de todas as marcas.</p></div><button className="cta">＋ Novo conteúdo</button></header>
    <article className="panel calendarPanel">
      <div className="calendarTop"><button>‹</button><h2>Outubro de 2026</h2><button>›</button><select><option>Todas as marcas</option><option>SaborBoost</option><option>Restaurante Vila</option></select></div>
      <div className="calendarGrid weekdays">{["SEG","TER","QUA","QUI","SEX","SÁB","DOM"].map(x=><b key={x}>{x}</b>)}</div>
      <div className="calendarGrid">{days.map((d,i)=><div className={d<1?"calendarCell mutedCell":"calendarCell"} key={i}>{d>0&&<><span>{d}</span>{(posts[d]||[]).map((p,j)=><small className={"event e"+j} key={p}>{p}</small>)}</>}</div>)}</div>
    </article>
  </AppShell>
}
