import{useState}from"react";
import{Shield,UserPlus}from"lucide-react";
import{Badge}from"../components/common/Badge";

export function QueuePage(){
const[supervisor,setSupervisor]=useState(false),[filter,setFilter]=useState("Todos");
const sectors=["Todos","Suporte","Financeiro","Comercial","Implantação"];
return <div className="page"><div className="page-head"><div><h2>Filas e distribuição</h2><p>Gestão visual da operação por setor e atendente.</p></div><label className="supervisor"><input type="checkbox" checked={supervisor} onChange={e=>setSupervisor(e.target.checked)}/><Shield/>Modo supervisor</label></div><div className="queue-filters">{sectors.map(s=><button className={filter===s?"active":""} onClick={()=>setFilter(s)} key={s}>{s}</button>)}</div><div className="cards-grid">{["Suporte","Financeiro","Comercial","Implantação"].filter(s=>filter==="Todos"||filter===s).map((s,i)=><div className="queue-card" key={s}><div className="queue-head"><strong>{s}</strong><Badge tone={i===0?"danger":"warning"}>{[31,8,5,4][i]} aguardando</Badge></div><div className="agent-row"><span>João Silva</span><b>6 ativos</b></div><div className="agent-row"><span>Ana Souza</span><b>4 ativos</b></div><div className="agent-row"><span>Carlos Lima</span><b>5 ativos</b></div><button className="wide-btn"><UserPlus/>Distribuir automaticamente</button></div>)}</div></div>
}
