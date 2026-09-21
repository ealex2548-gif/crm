import{FEATURES}from"../../config/features";
import{ChevronDown,ChevronUp}from"lucide-react";
import{MessageBubble}from"./MessageBubble";

export function MessageList({messages,searchChat,summaryOpen,setSummaryOpen,typing,onReply,onNewTicket}){
return <section className="messages"><div className="day">HOJE</div><div className={"summary "+(!summaryOpen?"collapsed":"")}><button onClick={()=>setSummaryOpen(v=>!v)}><span><b>☆ Resumo do caso</b><small>Última ação: cliente respondeu · Próximo passo: validar serviço</small></span>{summaryOpen?<ChevronUp/>:<ChevronDown/>}</button>{summaryOpen&&<div><p><b>Problema:</b> erro na tela de vendas.</p><p><b>Última ação:</b> solicitado print e validação local.</p><p><b>Próximo passo:</b> verificar serviço, banco e versão do PDV.</p></div>}</div>
{messages.filter(m=>!searchChat.trim()||m.text.toLowerCase().includes(searchChat.trim().toLowerCase())).map(m=><MessageBubble key={m.id} m={m} onReply={onReply} onNewTicket={onNewTicket}/>)}
{FEATURES.productivity&&typing&&<div className="typing">Maria está digitando<span>•••</span></div>}
</section>
}
