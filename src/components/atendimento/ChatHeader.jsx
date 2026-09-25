import{useState}from"react";
import{FEATURES}from"../../config/features";
import{ArrowLeft,Search,PanelRightClose,PanelRightOpen,MoreVertical,X}from"lucide-react";
import{Avatar}from"../common/Avatar";

// Linha abaixo do nome (como o "online" do WhatsApp): a situação do atendimento.
function statusLine(c){
if(c.status==="Finalizado")return"Atendimento finalizado";
if(!c.assignedAgentId)return"Aguardando atendimento";
if(c.status==="Aguardando aceite")return`Aguardando aceite · ${c.agent}`;
return`Em atendimento por ${c.agent}`;
}

// menu: ações do ⋮ (no celular é onde ficam Transferir, Nota etc., como no app do WhatsApp).
export function ChatHeader({active,detailsOpen,setDetailsOpen,setMobile,searchChat,setSearchChat,menu=[]}){
const[open,setOpen]=useState(false);
return <>
<header className="chat-head"><button className="mobile-back" onClick={()=>setMobile("list")}><ArrowLeft/></button><Avatar c={active} small/><button className="identity" onClick={()=>{setDetailsOpen(true);setMobile("details")}}><strong>{active.name}</strong><small>{statusLine(active)}</small></button><div className="chat-actions">{FEATURES.productivity&&<button title="Buscar na conversa" onClick={()=>setSearchChat(searchChat?"":" ")}><Search/></button>}<button className="desktop-toggle" title="Dados do cliente" onClick={()=>setDetailsOpen(v=>!v)}>{detailsOpen?<PanelRightClose/>:<PanelRightOpen/>}</button><button className="mobile-more" title="Mais opções" onClick={()=>setOpen(v=>!v)}><MoreVertical/></button></div>
{open&&<><div className="head-menu-backdrop" onClick={()=>setOpen(false)}/><div className="head-menu">{menu.map(([label,fn])=><button key={label} type="button" onClick={()=>{setOpen(false);fn()}}>{label}</button>)}</div></>}
</header>

{FEATURES.productivity&&searchChat!==""&&<div className="chat-search"><Search/><input autoFocus placeholder="Buscar nesta conversa..." onChange={e=>setSearchChat(e.target.value)}/><button onClick={()=>setSearchChat("")}><X/></button></div>}
</>
}
