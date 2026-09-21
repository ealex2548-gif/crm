import{Plus}from"lucide-react";
import{Badge}from"../components/common/Badge";

export function TicketsPage({tickets,setTickets}){
return <div className="page"><div className="page-head"><div><h2>Tickets</h2><p>Chamados ligados às conversas e mensagens.</p></div><button className="primary" onClick={()=>setTickets(t=>[{id:"#2555",client:"Novo cliente",title:"Novo chamado",status:"Novo",priority:"Normal",owner:"Sem responsável",deadline:"A definir"},...t])}><Plus/>Novo</button></div><div className="table"><div className="tr th"><span>ID</span><span>Cliente</span><span>Título</span><span>Status</span><span>Prioridade</span><span>Responsável</span><span>Prazo</span></div>{tickets.map(t=><div className="tr" key={t.id}><span>{t.id}</span><span>{t.client}</span><span>{t.title}</span><span><Badge>{t.status}</Badge></span><span><Badge tone={t.priority==="Urgente"||t.priority==="Alta"?"danger":"warning"}>{t.priority}</Badge></span><span>{t.owner}</span><span>{t.deadline}</span></div>)}</div></div>
}
