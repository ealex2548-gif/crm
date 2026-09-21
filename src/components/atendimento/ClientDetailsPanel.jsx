import{FEATURES}from"../../config/features";
import{ArrowLeft,MessageCircle,Phone,Monitor,Ticket}from"lucide-react";
import{Avatar}from"../common/Avatar";
import{ClienteTab}from"./tabs/ClienteTab";
import{PdvTab}from"./tabs/PdvTab";
import{ChecklistTab}from"./tabs/ChecklistTab";
import{HistoricoTab}from"./tabs/HistoricoTab";

export function ClientDetailsPanel({active,mobile,setMobile,tab,setTab,setPage,ticketsPageTarget="tickets",onUpdate}){
return <aside className={"details "+(mobile==="details"?"mobile-show":"")}>
<div className="details-head"><button className="mobile-back" onClick={()=>setMobile("chat")}><ArrowLeft/></button><strong>Dados do cliente</strong></div><div className="profile"><Avatar c={active}/><h2>{active.name}</h2><p>{active.phone} · {active.company}</p></div><div className="quick"><button><MessageCircle/>Mensagem</button><button><Phone/>Ligar</button><button><Monitor/>Remoto</button><button onClick={()=>FEATURES.tickets&&setPage(ticketsPageTarget)}><Ticket/>Chamados</button></div>
<div className="tabs"><button className={tab==="cliente"?"active":""} onClick={()=>setTab("cliente")}>Cliente</button><button className={tab==="pdv"?"active":""} onClick={()=>setTab("pdv")}>PDV</button><button className={tab==="checklist"?"active":""} onClick={()=>setTab("checklist")}>Checklist</button><button className={tab==="historico"?"active":""} onClick={()=>setTab("historico")}>Histórico</button></div>
<div className="detail-scroll">{tab==="cliente"&&<ClienteTab active={active} onUpdate={onUpdate}/>}
{tab==="pdv"&&<PdvTab active={active}/>}
{tab==="checklist"&&<ChecklistTab/>}
{tab==="historico"&&<HistoricoTab/>}<section><h3>Observação interna</h3><textarea placeholder="Adicione uma observação..."/></section></div>
</aside>
}
