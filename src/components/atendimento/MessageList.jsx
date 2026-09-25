import{Fragment,useLayoutEffect,useRef}from"react";
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
const boxRef=useRef(null);
const atBottom=useRef(true);
const prevCount=useRef(0);
const term=searchChat.trim().toLowerCase();
const visible=messages.filter(m=>!term||(m.text??"").toLowerCase().includes(term));

// Rola o próprio container até o fim (o padding de baixo deixa a última mensagem
// acima da barra de digitar, que fica por cima da área de mensagens).
const toBottom=()=>{const el=boxRef.current;if(el)el.scrollTop=el.scrollHeight};
const onScroll=()=>{const el=boxRef.current;if(el)atBottom.current=el.scrollHeight-el.scrollTop-el.clientHeight<120};

// Ao abrir a conversa vai para a última mensagem; mensagem nova só puxa para
// baixo se a pessoa já estava no fim (como no WhatsApp).
useLayoutEffect(()=>{
const opened=prevCount.current===0&&visible.length>0;
if(opened||atBottom.current)toBottom();
prevCount.current=visible.length;
},[visible.length]);

return <section className="messages" ref={boxRef} onScroll={onScroll} onLoadCapture={()=>atBottom.current&&toBottom()}>
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
</section>
}
