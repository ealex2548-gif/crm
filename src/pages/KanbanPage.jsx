import{Plus,GripVertical,CalendarClock}from"lucide-react";

export function KanbanPage({tickets}){
const cols=["Novo","Em atendimento","Aguardando cliente","Finalizado"];
return <div className="page"><div className="page-head"><div><h2>Kanban de chamados</h2><p>Estrutura visual para drag and drop.</p></div><button className="primary"><Plus/>Novo chamado</button></div><div className="kanban">{cols.map(c=><div className="col" key={c}><div className="col-head"><strong>{c}</strong><span>{tickets.filter(t=>t.status===c).length}</span></div>{tickets.filter(t=>t.status===c).map(t=><div className="ticket-card" key={t.id}><div className="drag"><GripVertical/></div><strong>{t.id} · {t.client}</strong><p>{t.title}</p><div className="tags"><i className={t.priority==="Urgente"||t.priority==="Alta"?"danger":"warning"}>{t.priority}</i><i>{t.owner}</i></div><small><CalendarClock/> {t.deadline}</small></div>)}</div>)}</div></div>
}
