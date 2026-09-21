import{FEATURES}from"../../config/features";
import{Ticket,StickyNote,Zap,BookOpen,Pin}from"lucide-react";

export function ChatToolbar({setPage,setDetailsOpen,setMobile,onNote,setQuickOpen}){
return <div className="tools"><button className="ticket" onClick={()=>FEATURES.tickets&&setPage("tickets")}><Ticket/>#2541</button><button onClick={()=>{setDetailsOpen(true);setMobile("details")}}>⇄ Transferir</button><button onClick={onNote}><StickyNote/>Nota</button><button onClick={()=>setQuickOpen(v=>!v)}><Zap/>Respostas rápidas</button><button onClick={()=>setPage("base")}><BookOpen/>Base</button>{FEATURES.productivity&&<button><Pin/>Fixadas</button>}</div>
}
