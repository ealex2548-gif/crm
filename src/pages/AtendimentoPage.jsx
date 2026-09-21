import{useState,useEffect}from"react";
import{useConversations}from"../hooks/useConversations";
import{useChatMessages}from"../hooks/useChatMessages";
import{getQuickReplies}from"../services/quickRepliesService";
import{updateConversation}from"../services/conversationsService";
import{ConversationListPanel}from"../components/atendimento/ConversationListPanel";
import{ChatPanel}from"../components/atendimento/ChatPanel";
import{ClientDetailsPanel}from"../components/atendimento/ClientDetailsPanel";
import{FinishServiceModal}from"../components/atendimento/FinishServiceModal";

export function AtendimentoPage({createTicket,setPage,ticketsPageTarget="tickets"}){
const{active,activeId,setActiveId,query,setQuery,filtered,loading}=useConversations();
const{messages,sendMessage,addNote,sendMedia}=useChatMessages(activeId);
const[quick,setQuick]=useState({});
const[draft,setDraft]=useState("");
const[detailsOpen,setDetailsOpen]=useState(true),[mobile,setMobile]=useState("list"),[tab,setTab]=useState("cliente");
const[summaryOpen,setSummaryOpen]=useState(true),[quickOpen,setQuickOpen]=useState(false),[quickCat,setQuickCat]=useState("PDV");
const[finishOpen,setFinishOpen]=useState(false),[searchChat,setSearchChat]=useState(""),[typing]=useState(true),[audio,setAudio]=useState(false);

useEffect(()=>{getQuickReplies().then(setQuick)},[]);

useEffect(()=>{
  const h=(e)=>{if(e.ctrlKey&&e.key.toLowerCase()==="k"){e.preventDefault();document.querySelector(".search input")?.focus()}if(e.ctrlKey&&e.key==="Enter")send()};
  window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)
},[draft,activeId]);

const send=()=>{if(!draft.trim()||!activeId)return;sendMessage(activeId,draft);setDraft("")};
const note=()=>{const t=window.prompt("Digite a nota interna:");if(activeId)addNote(activeId,t)};
const reply=(text)=>setDraft(`Respondendo: ${text.slice(0,40)} — `);
const ticketFromMessage=(text)=>createTicket({contactId:active.contactId,conversationId:active.id,title:text.slice(0,42),priority:active.priority,ownerId:active.assignedAgentId,deadline:null});
const updateActiveConversation=(patch)=>activeId&&updateConversation(activeId,patch);
const sendFile=(file)=>activeId&&sendMedia(activeId,file);

if(loading)return <div className="workspace"><section className="list-panel"><div className="list-head"><h1>Carregando...</h1></div></section></div>;
if(!active)return <div className="workspace"><section className="list-panel"><div className="list-head"><h1>Nenhuma conversa</h1></div></section></div>;

return <>
<div className={"workspace "+(detailsOpen?"details-open":"details-closed")}>
<ConversationListPanel filtered={filtered} activeId={activeId} query={query} setQuery={setQuery} mobile={mobile} onSelect={(id)=>{setActiveId(id);setMobile("chat")}}/>
<ChatPanel
  active={active}
  mobile={mobile} setMobile={setMobile}
  detailsOpen={detailsOpen} setDetailsOpen={setDetailsOpen}
  searchChat={searchChat} setSearchChat={setSearchChat}
  setPage={setPage}
  ticketsPageTarget={ticketsPageTarget}
  onNote={note}
  quickOpen={quickOpen} setQuickOpen={setQuickOpen}
  quickCat={quickCat} setQuickCat={setQuickCat}
  quick={quick}
  messages={messages}
  summaryOpen={summaryOpen} setSummaryOpen={setSummaryOpen}
  typing={typing}
  draft={draft} setDraft={setDraft}
  onSend={send}
  onSendFile={sendFile}
  audio={audio} setAudio={setAudio}
  onReply={reply}
  onNewTicket={ticketFromMessage}
  onFinish={()=>setFinishOpen(true)}
/>
<ClientDetailsPanel active={active} mobile={mobile} setMobile={setMobile} tab={tab} setTab={setTab} setPage={setPage} ticketsPageTarget={ticketsPageTarget} onUpdate={updateActiveConversation}/>
</div>
{finishOpen&&<FinishServiceModal onClose={()=>setFinishOpen(false)}/>}
</>
}
