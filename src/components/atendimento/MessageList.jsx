import{Fragment,useEffect,useRef}from"react";
import{MessageBubble}from"./MessageBubble";

// "HOJE" / "ONTEM" / dia da semana (últimos 7 dias) / data — igual ao WhatsApp.
function dayLabel(date){
const d=new Date(date),today=new Date();
const days=Math.round((new Date(today.toDateString())-new Date(d.toDateString()))/86400000);
if(days===0)return"HOJE";
if(days===1)return"ONTEM";
if(days<7)return d.toLocaleDateString("pt-BR",{weekday:"long"}).toUpperCase();
return d.toLocaleDateString("pt-BR");
}

export function MessageList({messages,searchChat,onReply,onNewTicket}){
const endRef=useRef(null);
const term=searchChat.trim().toLowerCase();
const visible=messages.filter(m=>!term||(m.text??"").toLowerCase().includes(term));

// Rola para a última mensagem ao abrir a conversa e quando chega/sai mensagem.
useEffect(()=>{endRef.current?.scrollIntoView({block:"end"})},[visible.length]);

return <section className="messages">
{visible.map((m,i)=>{
const prev=visible[i-1];
const label=dayLabel(m.createdAt);
const newDay=!prev||dayLabel(prev.createdAt)!==label;
// Primeira de uma sequência do mesmo lado ganha o "biquinho" e mais espaço.
const first=newDay||prev.side!==m.side;
return <Fragment key={m.id}>
{newDay&&<div className="day">{label}</div>}
<MessageBubble m={m} first={first} onReply={onReply} onNewTicket={onNewTicket}/>
</Fragment>})}
<div ref={endRef}/>
</section>
}
