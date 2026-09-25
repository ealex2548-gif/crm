import{useState}from"react";
import{Search}from"lucide-react";
import{ConversationItem}from"./ConversationItem";

// "Todas" mostra tudo, inclusive finalizadas (etiqueta cinza); os outros filtros
// olham só o que está em andamento, e "Finalizadas" separa o histórico.
const FILTERS=[
["todas","Todas",()=>true],
["naoLidas","Não lidas",(c)=>c.unread>0],
["meus","Meus atendimentos",(c,userId)=>c.status!=="Finalizado"&&c.assignedAgentId===userId],
["sla","SLA crítico",(c)=>c.status!=="Finalizado"&&c.slaStatus==="breached"],
["finalizadas","Finalizadas",(c)=>c.status==="Finalizado"],
];

export function ConversationListPanel({filtered,activeId,query,setQuery,mobile,onSelect,userId,onMarkRead}){
const[filter,setFilter]=useState("todas");
const test=FILTERS.find(([k])=>k===filter)[2];
const visible=filtered.filter(c=>test(c,userId));
return <section className={"list-panel "+(mobile==="list"?"mobile-show":"")}>
<div className="list-head">
<div className="title-row"><h1>Conversas</h1></div>
<div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar conversa (Ctrl+K)"/></div>
<div className="filters">{FILTERS.map(([k,label])=><span key={k} role="button" className={filter===k?"active":""} onClick={()=>setFilter(k)}>{label}</span>)}</div>
</div>
<div className="conversations">
{visible.map(c=><ConversationItem key={c.id} c={c} active={c.id===activeId} onSelect={()=>onSelect(c.id)} onMarkRead={onMarkRead}/>)}
{visible.length===0&&<p className="empty-hint list-empty">Nenhuma conversa aqui.</p>}
</div>
</section>
}
