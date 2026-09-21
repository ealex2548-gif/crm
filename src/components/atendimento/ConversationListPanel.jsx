import{Search,Plus,MoreVertical}from"lucide-react";
import{ConversationItem}from"./ConversationItem";

export function ConversationListPanel({filtered,activeId,query,setQuery,mobile,onSelect}){
return <section className={"list-panel "+(mobile==="list"?"mobile-show":"")}>
<div className="list-head">
<div className="title-row"><h1>Conversas</h1><div><button><Plus/></button><button><MoreVertical/></button></div></div>
<div className="search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar conversa (Ctrl+K)"/></div>
<div className="filters"><span className="active">Todas</span><span>Não lidas</span><span>Meus atendimentos</span><span>SLA crítico</span></div>
</div>
<div className="conversations">{filtered.map(c=><ConversationItem key={c.id} c={c} active={c.id===activeId} onSelect={()=>onSelect(c.id)}/>)}</div>
</section>
}
