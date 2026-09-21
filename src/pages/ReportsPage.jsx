import{useEffect,useState}from"react";
import{Filter}from"lucide-react";
import{getReportsSummary}from"../services/reportsService";
import{formatDurationMinutes}from"../utils/formatTime";

export function ReportsPage(){
const[data,setData]=useState(null);
useEffect(()=>{getReportsSummary().then(setData)},[]);

if(!data)return <div className="page"><div className="page-head"><div><h2>Relatórios</h2><p>Visão visual por atendente, setor e período.</p></div></div><p>Carregando...</p></div>;

const maxAgent=Math.max(1,...data.attendancesByAgent.map((a)=>a.count));

return <div className="page"><div className="page-head"><div><h2>Relatórios</h2><p>Visão visual por atendente, setor e período.</p></div><div><button className="secondary"><Filter/>Filtros</button></div></div>
<div className="reports">
<div className="panel"><h3>Atendimentos por atendente</h3>{data.attendancesByAgent.length===0&&<p>Sem dados ainda.</p>}{data.attendancesByAgent.map(({agent,count})=><div className="bar" key={agent}><span>{agent}</span><div><i style={{width:(count/maxAgent*100)+"%"}}/></div><b>{count}</b></div>)}</div>
<div className="panel"><h3>Tempo médio de resolução</h3><div className="big-number">{data.avgResolutionMinutes!=null?formatDurationMinutes(data.avgResolutionMinutes):"—"}</div><small>entre abertura e fechamento do ticket</small></div>
<div className="panel"><h3>Clientes com mais chamados</h3>{data.topClients.length===0&&<p>Sem dados ainda.</p>}{data.topClients.map(({name,count})=><div className="line" key={name}><span>{name}</span><b>{count}</b></div>)}</div>
</div>
</div>
}
