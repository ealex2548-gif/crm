import{FEATURES}from"../../config/features";
import{Reply,Copy,Star,FilePlus2,FileText}from"lucide-react";

export function MessageBubble({m,onReply,onNewTicket}){
const isImage=m.mediaUrl&&/\.(png|jpe?g|gif|webp)$/i.test(m.mediaUrl);
return <div className={"bubble-wrap "+m.side}><div className={"bubble "+m.side}>{m.side==="note"&&<b>📝 Nota interna</b>}
{m.mediaUrl?(isImage?<img src={m.mediaUrl} alt={m.text||"anexo"} className="bubble-media"/>:<a href={m.mediaUrl} target="_blank" rel="noreferrer" className="bubble-file"><FileText/>{m.text||"Arquivo"}</a>):<span>{m.text}</span>}
<small>{m.time}{m.side==="out"?" ✓✓":""}</small></div>{FEATURES.productivity&&m.side!=="note"&&<div className="msg-actions"><button onClick={()=>onReply(m.text)}><Reply/></button><button onClick={()=>navigator.clipboard?.writeText(m.text)}><Copy/></button><button><Star/></button><button onClick={()=>onNewTicket(m.text)}><FilePlus2/></button></div>}</div>
}
