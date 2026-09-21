import{useState}from"react";
import{Shield,UserPlus}from"lucide-react";
import{Badge}from"../components/common/Badge";
import{SECTORS}from"../data/sectors";
import{queueStats,queueAgents}from"../data/queueStats";

export function QueuePage(){
const[supervisor,setSupervisor]=useState(false),[filter,setFilter]=useState("Todos");
const sectors=["Todos",...SECTORS];
return <div className="page"><div className="page-head"><div><h2>Filas e distribuição</h2><p>Gestão visual da operação por setor e atendente.</p></div><label className="supervisor"><input type="checkbox" checked={supervisor} onChange={e=>setSupervisor(e.target.checked)}/><Shield/>Modo supervisor</label></div><div className="queue-filters">{sectors.map(s=><button className={filter===s?"active":""} onClick={()=>setFilter(s)} key={s}>{s}</button>)}</div><div className="cards-grid">{queueStats.filter(q=>filter==="Todos"||filter===q.sector).map((q,i)=><div className="queue-card" key={q.sector}><div className="queue-head"><strong>{q.sector}</strong><Badge tone={i===0?"danger":"warning"}>{q.waiting} aguardando</Badge></div>{queueAgents.map(a=><div className="agent-row" key={a.name}><span>{a.name}</span><b>{a.active} ativos</b></div>)}<button className="wide-btn"><UserPlus/>Distribuir automaticamente</button></div>)}</div></div>
}
