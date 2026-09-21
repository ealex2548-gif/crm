import{ChatHeader}from"./ChatHeader";
import{ChatStatusBar}from"./ChatStatusBar";
import{ChatToolbar}from"./ChatToolbar";
import{MessageList}from"./MessageList";
import{QuickRepliesPopover}from"./QuickRepliesPopover";
import{Composer}from"./Composer";

export function ChatPanel({active,mobile,setMobile,detailsOpen,setDetailsOpen,searchChat,setSearchChat,setPage,onNote,quickOpen,setQuickOpen,quickCat,setQuickCat,quick,messages,summaryOpen,setSummaryOpen,typing,draft,setDraft,onSend,onSendFile,audio,setAudio,onReply,onNewTicket,onFinish}){
return <section className={"chat-panel "+(mobile==="chat"?"mobile-show":"")}>
<ChatHeader active={active} detailsOpen={detailsOpen} setDetailsOpen={setDetailsOpen} setMobile={setMobile} searchChat={searchChat} setSearchChat={setSearchChat}/>
<ChatStatusBar active={active} onFinish={onFinish}/>
<ChatToolbar setPage={setPage} setDetailsOpen={setDetailsOpen} setMobile={setMobile} onNote={onNote} setQuickOpen={setQuickOpen}/>
<MessageList messages={messages} searchChat={searchChat} summaryOpen={summaryOpen} setSummaryOpen={setSummaryOpen} typing={typing} onReply={onReply} onNewTicket={onNewTicket}/>
{quickOpen&&<QuickRepliesPopover quick={quick} quickCat={quickCat} setQuickCat={setQuickCat} onPick={(q)=>{setDraft(q);setQuickOpen(false)}} onClose={()=>setQuickOpen(false)}/>}
<Composer draft={draft} setDraft={setDraft} onSend={onSend} onSendFile={onSendFile} audio={audio} setAudio={setAudio}/>
</section>
}
