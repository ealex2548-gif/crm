import{RefreshCw}from"lucide-react";
import{dashboardMetrics,queueBySector,slaByPriority}from"../data/dashboardStats";

export function DashboardPage(){
return <div className="page"><div className="page-head"><div><h2>Dashboard</h2><p>Indicadores operacionais do suporte.</p></div><button className="secondary"><RefreshCw/>Atualizar</button></div><div className="metrics">{dashboardMetrics.map(([a,b,c])=><div className="metric" key={a}><span>{a}</span><strong>{b}</strong><small>{c}</small></div>)}</div><div className="dash-grid"><div className="panel"><h3>Fila por setor</h3>{queueBySector.map(([n,p])=><div className="bar" key={n}><span>{n}</span><div><i style={{width:p+"%"}}/></div><b>{p}%</b></div>)}</div><div className="panel"><h3>SLA por prioridade</h3>{slaByPriority.map(x=><div className="line" key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div></div></div>
}
