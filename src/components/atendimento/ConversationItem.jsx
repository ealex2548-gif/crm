import{useState}from"react";
import{Clock3,ChevronDown}from"lucide-react";
import{Avatar}from"../common/Avatar";

// div (e não <button>) porque tem o botão do menu ⌄ dentro.
export function ConversationItem({c,active,onSelect,onMarkRead}){
const[menu,setMenu]=useState(false);
const mark=(read)=>(e)=>{e.stopPropagation();setMenu(false);onMarkRead?.(c.id,read)};
return <div role="button" tabIndex={0} className={"conversation "+(active?"active":"")} onClick={onSelect} onKeyDown={e=>e.key==="Enter"&&onSelect()} onMouseLeave={()=>setMenu(false)}>
<Avatar c={c}/><div className="conv-main"><div className="conv-top"><strong>{c.name}</strong><span className={c.unread>0?"unread":""}>{c.time}</span></div><div className="preview"><span>{c.preview}</span>{c.unread>0&&<b>{c.unread}</b>}{onMarkRead&&<button type="button" className="conv-menu-btn" title="Mais opções" onClick={e=>{e.stopPropagation();setMenu(v=>!v)}}><ChevronDown/></button>}</div><div className="waitline"><Clock3/> esperando {c.waiting}{c.hasNote&&<span>• nota interna</span>}</div><div className="tags"><i>{c.sector}</i><i className={(c.priority==="Alta"||c.priority==="Urgente")?"danger":"warning"}>{c.priority}</i>{c.status==="Aguardando aceite"?<i className="waiting-tag">Aguardando aceite · {c.agent.split(" ")[0]}</i>:c.status==="Finalizado"?<i className="done-tag">Finalizada</i>:c.assignedAgentId?<i className="muted">{c.agent.split(" ")[0]}</i>:<i className="waiting-tag">Aguardando</i>}<i className={"sla "+(c.slaStatus==="breached"?"sla-breached":"")}>SLA {c.sla}</i></div></div>
{menu&&<div className="conv-menu">{c.unread>0?<button type="button" onClick={mark(true)}>Marcar como lida</button>:<button type="button" onClick={mark(false)}>Marcar como não lida</button>}</div>}
</div>
}
