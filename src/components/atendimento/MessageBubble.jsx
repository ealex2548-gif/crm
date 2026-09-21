import{FEATURES}from"../../config/features";
import{Reply,Copy,Star,FilePlus2}from"lucide-react";

export function MessageBubble({m,onReply,onNewTicket}){
return <div className={"bubble-wrap "+m.side}><div className={"bubble "+m.side}>{m.side==="note"&&<b>📝 Nota interna</b>}<span>{m.text}</span><small>{m.time}{m.side==="out"?" ✓✓":""}</small></div>{FEATURES.productivity&&m.side!=="note"&&<div className="msg-actions"><button onClick={()=>onReply(m.text)}><Reply/></button><button onClick={()=>navigator.clipboard?.writeText(m.text)}><Copy/></button><button><Star/></button><button onClick={()=>onNewTicket(m.text)}><FilePlus2/></button></div>}</div>
}
