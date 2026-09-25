import{Ticket,StickyNote,Zap,BookOpen,ArrowLeftRight,Plus}from"lucide-react";

// ticket: o ticket mais recente desta conversa (ou null). Sem ticket, o botão vira "Criar ticket".
export function ChatToolbar({ticket,onTicket,onTransfer,onNote,setQuickOpen,setPage}){
return <div className="tools">
<button className="ticket" onClick={onTicket} title={ticket?`${ticket.title} — ${ticket.status}`:"Abrir um ticket para esta conversa"}>{ticket?<><Ticket/>{ticket.id} · {ticket.status}</>:<><Plus/>Criar ticket</>}</button>
<button onClick={onTransfer}><ArrowLeftRight/>Transferir</button>
<button onClick={onNote}><StickyNote/>Nota</button>
<button onClick={()=>setQuickOpen(v=>!v)}><Zap/>Respostas rápidas</button>
<button onClick={()=>setPage("base")}><BookOpen/>Base</button>
</div>
}
