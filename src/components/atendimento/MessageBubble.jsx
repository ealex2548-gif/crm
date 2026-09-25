import{useState}from"react";
import{FEATURES}from"../../config/features";
import{ChevronDown,FileText}from"lucide-react";
import{AudioPlayer}from"./AudioPlayer";

const MEDIA_LABELS=["📷 Imagem","🎬 Vídeo","🎤 Áudio","📄 Documento","Figurinha"];

// Tiques como no WhatsApp: 🕓 enviando · ✓ enviado · ✓✓ entregue · ✓✓ azul lido.
function Ticks({m}){
if(m.side!=="out")return null;
if(m.pending)return <span className="ticks">🕓</span>;
if(m.status==="FAILED")return <span className="ticks failed" title="Falhou">⚠</span>;
if(m.status==="READ")return <span className="ticks read">✓✓</span>;
if(m.status==="DELIVERED")return <span className="ticks">✓✓</span>;
return <span className="ticks">✓</span>;
}

// Transforma URLs e "www." em links clicáveis.
function Linkify({text}){
return String(text??"").split(/((?:https?:\/\/|www\.)[^\s]+)/g).map((part,i)=>
i%2?<a key={i} href={part.startsWith("http")?part:`https://${part}`} target="_blank" rel="noreferrer">{part}</a>:part);
}

export function MessageBubble({m,first,onReply,onNewTicket}){
const[menu,setMenu]=useState(false);
const isImage=m.mediaUrl&&/\.(png|jpe?g|gif|webp)$/i.test(m.mediaUrl);
const isAudio=m.mediaUrl&&/\.(ogg|mp3|m4a|aac|amr|wav)$/i.test(m.mediaUrl);
const isVideo=m.mediaUrl&&/\.(mp4|3gp)$/i.test(m.mediaUrl);
// Legenda da mídia (o texto padrão "📷 Imagem" etc. só serve para a prévia da lista).
const caption=m.mediaUrl?(m.text&&!MEDIA_LABELS.includes(m.text)?m.text:null):m.text;
const meta=<span className="meta">{m.time}<Ticks m={m}/></span>;

const act=(fn)=>{setMenu(false);fn()};

return <div className={"bubble-wrap "+m.side+(first?" first":"")} onMouseLeave={()=>setMenu(false)}>
<div className={"bubble "+m.side+(first?" tail":"")+(isAudio?" audio":"")}>
{m.side==="note"&&<b className="note-title">📝 Nota interna</b>}
{isImage&&<img src={m.mediaUrl} alt={m.text||"imagem"} className="bubble-media"/>}
{isAudio&&<AudioPlayer src={m.mediaUrl}/>}
{isVideo&&<video src={m.mediaUrl} controls className="bubble-media"/>}
{m.mediaUrl&&!isImage&&!isAudio&&!isVideo&&<a href={m.mediaUrl} target="_blank" rel="noreferrer" className="bubble-file"><FileText/>{m.text||"Arquivo"}</a>}
{caption?<div className="bubble-text"><Linkify text={caption}/><span className="meta-spacer"/>{meta}</div>:<div className="bubble-text only-meta">{meta}</div>}
{FEATURES.productivity&&m.side!=="note"&&!m.pending&&<button type="button" className="bubble-menu-btn" title="Mais opções" onClick={()=>setMenu(v=>!v)}><ChevronDown/></button>}
{menu&&<div className="bubble-menu">
<button type="button" onClick={()=>act(()=>onReply(m.text))}>Responder</button>
<button type="button" onClick={()=>act(()=>navigator.clipboard?.writeText(m.text??""))}>Copiar</button>
<button type="button" onClick={()=>act(()=>onNewTicket(m.text))}>Criar ticket</button>
</div>}
</div>
</div>
}
