import{FEATURES}from"../../config/features";
import{Reply,Copy,Star,FilePlus2,FileText}from"lucide-react";

const MEDIA_LABELS=["📷 Imagem","🎬 Vídeo","🎤 Áudio","📄 Documento","Figurinha"];

export function MessageBubble({m,onReply,onNewTicket}){
const isImage=m.mediaUrl&&/\.(png|jpe?g|gif|webp)$/i.test(m.mediaUrl);
const isAudio=m.mediaUrl&&/\.(ogg|mp3|m4a|aac|amr|wav)$/i.test(m.mediaUrl);
const isVideo=m.mediaUrl&&/\.(mp4|3gp)$/i.test(m.mediaUrl);
// Legenda da mídia (o texto padrão "📷 Imagem" etc. só serve para a prévia da lista).
const caption=m.text&&!MEDIA_LABELS.includes(m.text)?m.text:null;
return <div className={"bubble-wrap "+m.side}><div className={"bubble "+m.side}>{m.side==="note"&&<b>📝 Nota interna</b>}
{m.mediaUrl?(isImage||isAudio||isVideo?<>{isImage&&<img src={m.mediaUrl} alt={m.text||"anexo"} className="bubble-media"/>}{isAudio&&<audio src={m.mediaUrl} controls className="bubble-media"/>}{isVideo&&<video src={m.mediaUrl} controls className="bubble-media"/>}{caption&&<span>{caption}</span>}</>:<a href={m.mediaUrl} target="_blank" rel="noreferrer" className="bubble-file"><FileText/>{m.text||"Arquivo"}</a>):<span>{m.text}</span>}
<small>{m.time}{m.side==="out"?(m.pending?" 🕓":" ✓✓"):""}</small></div>{FEATURES.productivity&&m.side!=="note"&&<div className="msg-actions"><button onClick={()=>onReply(m.text)}><Reply/></button><button onClick={()=>navigator.clipboard?.writeText(m.text)}><Copy/></button><button><Star/></button><button onClick={()=>onNewTicket(m.text)}><FilePlus2/></button></div>}</div>
}
