import{Clock3}from"lucide-react";
import{Avatar}from"../common/Avatar";

export function ConversationItem({c,active,onSelect}){
return <button className={"conversation "+(active?"active":"")} onClick={onSelect}>
<Avatar c={c}/><div className="conv-main"><div className="conv-top"><strong>{c.name}</strong><span>{c.time}</span></div><div className="preview"><span>{c.preview}</span>{c.unread>0&&<b>{c.unread}</b>}</div><div className="waitline"><Clock3/> esperando {c.waiting}{c.hasNote&&<span>• nota interna</span>}</div><div className="tags"><i>{c.sector}</i><i className={(c.priority==="Alta"||c.priority==="Urgente")?"danger":"warning"}>{c.priority}</i><i className="muted">{c.agent.split(" ")[0]}</i><i className="sla">SLA {c.sla}</i></div></div>
</button>
}
