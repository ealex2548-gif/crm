import{Filter}from"lucide-react";
import{attendancesByAgent,averageResolutionTime,topClientsByTickets}from"../data/reportsStats";

export function ReportsPage(){
return <div className="page"><div className="page-head"><div><h2>Relatórios</h2><p>Visão visual por atendente, setor e período.</p></div><div><button className="secondary"><Filter/>Filtros</button></div></div><div className="reports"><div className="panel"><h3>Atendimentos por atendente</h3>{attendancesByAgent.map(([n,v])=><div className="bar" key={n}><span>{n}</span><div><i style={{width:v*2+"%"}}/></div><b>{v}</b></div>)}</div><div className="panel"><h3>Tempo médio</h3><div className="big-number">{averageResolutionTime}</div><small>tempo médio de resolução</small></div><div className="panel"><h3>Clientes com mais chamados</h3>{topClientsByTickets.map(x=><div className="line" key={x}>{x}</div>)}</div></div></div>
}
