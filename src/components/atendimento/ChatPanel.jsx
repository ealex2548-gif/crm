import{ChatHeader}from"./ChatHeader";
import{ChatStatusBar}from"./ChatStatusBar";
import{ChatToolbar}from"./ChatToolbar";
import{MessageList}from"./MessageList";
import{QuickRepliesPopover}from"./QuickRepliesPopover";
import{Composer}from"./Composer";
import{AcceptBar}from"./AcceptBar";

export function ChatPanel({userId,onAccept,joined,onJoin,active,mobile,setMobile,detailsOpen,setDetailsOpen,searchChat,setSearchChat,setPage,ticket,onTicket,onTransfer,onNote,quickOpen,setQuickOpen,quickReplies,canManage,onQuickChanged,messages,draft,setDraft,onSend,onSendFile,onReply,onNewTicket,onFinish}){
return <section className={"chat-panel "+(mobile==="chat"?"mobile-show":"")}>
<ChatHeader active={active} detailsOpen={detailsOpen} setDetailsOpen={setDetailsOpen} setMobile={setMobile} searchChat={searchChat} setSearchChat={setSearchChat}/>
<ChatStatusBar active={active} onFinish={onFinish}/>
<ChatToolbar ticket={ticket} onTicket={onTicket} onTransfer={onTransfer} onNote={onNote} setQuickOpen={setQuickOpen} setPage={setPage}/>
<MessageList messages={messages} searchChat={searchChat} onReply={onReply} onNewTicket={onNewTicket}/>
{quickOpen&&<QuickRepliesPopover replies={quickReplies} canManage={canManage} onChanged={onQuickChanged} onPick={(q)=>{setDraft(q);setQuickOpen(false)}} onClose={()=>setQuickOpen(false)}/>}
{/* Sem responsável: fechada até alguém iniciar. Com colega atendendo: atendente só lê (gestão pode intervir). */}
{!active.assignedAgentId||(active.status==="Aguardando aceite"&&(active.assignedAgentId===userId||canManage))?<AcceptBar active={active} mine={active.assignedAgentId===userId} onAccept={onAccept} onTransfer={onTransfer}/>
:active.assignedAgentId!==userId&&!canManage?<AcceptBar active={active} takenBy={active.agent}/>
:active.assignedAgentId!==userId&&!joined?<AcceptBar active={active} takenBy={active.agent} onJoin={onJoin}/>
:<Composer draft={draft} setDraft={setDraft} onSend={onSend} onSendFile={onSendFile}/>}
</section>
}
