import{MessageBubble}from"./MessageBubble";

export function MessageList({messages,searchChat,onReply,onNewTicket}){
return <section className="messages"><div className="day">HOJE</div>
{messages.filter(m=>!searchChat.trim()||m.text.toLowerCase().includes(searchChat.trim().toLowerCase())).map(m=><MessageBubble key={m.id} m={m} onReply={onReply} onNewTicket={onNewTicket}/>)}

</section>
}
