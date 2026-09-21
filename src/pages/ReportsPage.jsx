import{Filter}from"lucide-react";

export function ReportsPage(){
return <div className="page"><div className="page-head"><div><h2>Relatórios</h2><p>Visão visual por atendente, setor e período.</p></div><div><button className="secondary"><Filter/>Filtros</button></div></div><div className="reports"><div className="panel"><h3>Atendimentos por atendente</h3>{[["João Silva",38],["Ana Souza",31],["Carlos Lima",26]].map(([n,v])=><div className="bar" key={n}><span>{n}</span><div><i style={{width:v*2+"%"}}/></div><b>{v}</b></div>)}</div><div className="panel"><h3>Tempo médio</h3><div className="big-number">18m 42s</div><small>tempo médio de resolução</small></div><div className="panel"><h3>Clientes com mais chamados</h3>{["Mercado Silva · 12","Mercado Oliveira · 9","Padaria do João · 7"].map(x=><div className="line" key={x}>{x}</div>)}</div></div></div>
}
