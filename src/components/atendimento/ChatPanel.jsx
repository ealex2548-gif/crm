import{ChatHeader}from"./ChatHeader";
import{ChatStatusBar}from"./ChatStatusBar";
import{ChatToolbar}from"./ChatToolbar";
import{MessageList}from"./MessageList";
import{QuickRepliesPopover}from"./QuickRepliesPopover";
import{Composer}from"./Composer";

export function ChatPanel({active,mobile,setMobile,detailsOpen,setDetailsOpen,searchChat,setSearchChat,setPage,ticket,onTicket,onTransfer,onNote,quickOpen,setQuickOpen,quickReplies,canManage,onQuickChanged,messages,draft,setDraft,onSend,onSendFile,onReply,onNewTicket,onFinish}){
return <section className={"chat-panel "+(mobile==="chat"?"mobile-show":"")}>
<ChatHeader active={active} detailsOpen={detailsOpen} setDetailsOpen={setDetailsOpen} setMobile={setMobile} searchChat={searchChat} setSearchChat={setSearchChat}/>
<ChatStatusBar active={active} onFinish={onFinish}/>
<ChatToolbar ticket={ticket} onTicket={onTicket} onTransfer={onTransfer} onNote={onNote} setQuickOpen={setQuickOpen} setPage={setPage}/>
<MessageList messages={messages} searchChat={searchChat} onReply={onReply} onNewTicket={onNewTicket}/>
{quickOpen&&<QuickRepliesPopover replies={quickReplies} canManage={canManage} onChanged={onQuickChanged} onPick={(q)=>{setDraft(q);setQuickOpen(false)}} onClose={()=>setQuickOpen(false)}/>}
<Composer draft={draft} setDraft={setDraft} onSend={onSend} onSendFile={onSendFile}/>
</section>
}
