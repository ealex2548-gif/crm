import{useEffect,useState}from"react";
import{RefreshCw}from"lucide-react";
import{getDashboardSummary}from"../services/dashboardService";
import{priorityToDisplay}from"../services/enumMappers";
import{formatDurationMinutes}from"../utils/formatTime";

export function DashboardPage(){
const[data,setData]=useState(null);
const load=()=>getDashboardSummary().then(setData);
useEffect(()=>{load()},[]);

if(!data)return <div className="page"><div className="page-head"><div><h2>Dashboard</h2><p>Indicadores operacionais do suporte.</p></div></div><p>Carregando...</p></div>;

const metrics=[
["Conversas abertas",String(data.openConversations),""],
["Acima do SLA",String(data.breachedSla),data.breachedSla>0?"atenção":""],
["1ª resposta",data.avgFirstResponseMinutes!=null?formatDurationMinutes(data.avgFirstResponseMinutes):"—",""],
["Resolvidos hoje",String(data.resolvedToday),""],
["Tickets em aberto",String(data.openTickets),""],
];
const maxSector=Math.max(1,...data.queueBySector.map((s)=>s.count));

return <div className="page"><div className="page-head"><div><h2>Dashboard</h2><p>Indicadores operacionais do suporte.</p></div><button className="secondary" onClick={load}><RefreshCw/>Atualizar</button></div>
<div className="metrics">{metrics.map(([a,b,c])=><div className="metric" key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}</div>
<div className="dash-grid">
<div className="panel"><h3>Fila por setor</h3>{data.queueBySector.length===0&&<p>Nenhuma conversa em aberto.</p>}{data.queueBySector.map(({sector,count})=><div className="bar" key={sector}><span>{sector}</span><div><i style={{width:(count/maxSector*100)+"%"}}/></div><b>{count}</b></div>)}</div>
<div className="panel"><h3>SLA por prioridade (meta de 1ª resposta)</h3>{Object.entries(data.slaPolicy).map(([p,minutes])=><div className="line" key={p}><span>{priorityToDisplay(p)}</span><b>{formatDurationMinutes(minutes)}</b></div>)}</div>
</div>
</div>
}
