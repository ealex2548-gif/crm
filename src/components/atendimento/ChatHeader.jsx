import{FEATURES}from"../../config/features";
import{ArrowLeft,Search,Phone,PanelRightClose,PanelRightOpen,MoreVertical,X}from"lucide-react";
import{Avatar}from"../common/Avatar";

export function ChatHeader({active,detailsOpen,setDetailsOpen,setMobile,searchChat,setSearchChat}){
return <>
<header className="chat-head"><button className="mobile-back" onClick={()=>setMobile("list")}><ArrowLeft/></button><Avatar c={active} small/><button className="identity" onClick={()=>{setDetailsOpen(true);setMobile("details")}}><strong>{active.name}</strong><small>{active.online?"online · ":""}{active.company}</small></button><div className="chat-actions">{FEATURES.productivity&&<button onClick={()=>setSearchChat(searchChat?"":" ")}><Search/></button>}<button><Phone/></button><button className="desktop-toggle" onClick={()=>setDetailsOpen(v=>!v)}>{detailsOpen?<PanelRightClose/>:<PanelRightOpen/>}</button><button className="mobile-more" onClick={()=>setMobile("details")}><MoreVertical/></button></div></header>

{FEATURES.productivity&&searchChat!==""&&<div className="chat-search"><Search/><input autoFocus placeholder="Buscar nesta conversa..." onChange={e=>setSearchChat(e.target.value)}/><button onClick={()=>setSearchChat("")}><X/></button></div>}
</>
}
