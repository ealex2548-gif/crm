import{useState}from"react";
import{Plus,GripVertical,CalendarClock}from"lucide-react";

export function KanbanPage({tickets,updateTicketStatus}){
const cols=["Novo","Em atendimento","Aguardando cliente","Finalizado"];
const[dragOverCol,setDragOverCol]=useState(null);

const handleDrop=(e,col)=>{
e.preventDefault();
setDragOverCol(null);
const ticketId=e.dataTransfer.getData("text/plain");
if(ticketId)updateTicketStatus?.(ticketId,col);
};

return <div className="page"><div className="page-head"><div><h2>Kanban de chamados</h2><p>Arraste um chamado para mudar o status.</p></div><button className="primary"><Plus/>Novo chamado</button></div><div className="kanban">{cols.map(c=><div className={"col "+(dragOverCol===c?"drag-over":"")} key={c} onDragOver={(e)=>{e.preventDefault();setDragOverCol(c)}} onDragLeave={()=>setDragOverCol(cur=>cur===c?null:cur)} onDrop={(e)=>handleDrop(e,c)}><div className="col-head"><strong>{c}</strong><span>{tickets.filter(t=>t.status===c).length}</span></div>{tickets.filter(t=>t.status===c).map(t=><div className="ticket-card" key={t.ticketId} draggable onDragStart={(e)=>e.dataTransfer.setData("text/plain",t.ticketId)}><div className="drag"><GripVertical/></div><strong>{t.id} · {t.client}</strong><p>{t.title}</p><div className="tags"><i className={t.priority==="Urgente"||t.priority==="Alta"?"danger":"warning"}>{t.priority}</i><i>{t.owner}</i></div><small><CalendarClock/> {t.deadline}</small></div>)}</div>)}</div></div>
}
