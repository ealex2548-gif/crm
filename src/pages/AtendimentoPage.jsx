import{useState,useEffect}from"react";
import{useConversations}from"../hooks/useConversations";
import{useChatMessages}from"../hooks/useChatMessages";
import{getQuickReplies}from"../services/quickRepliesService";
import{ConversationListPanel}from"../components/atendimento/ConversationListPanel";
import{ChatPanel}from"../components/atendimento/ChatPanel";
import{ClientDetailsPanel}from"../components/atendimento/ClientDetailsPanel";
import{FinishServiceModal}from"../components/atendimento/FinishServiceModal";

export function AtendimentoPage({createTicket,setPage}){
const{active,activeId,setActiveId,query,setQuery,filtered}=useConversations();
const{messages,sendMessage,addNote}=useChatMessages();
const[draft,setDraft]=useState("");
const[detailsOpen,setDetailsOpen]=useState(true),[mobile,setMobile]=useState("list"),[tab,setTab]=useState("cliente");
const[summaryOpen,setSummaryOpen]=useState(true),[quickOpen,setQuickOpen]=useState(false),[quickCat,setQuickCat]=useState("PDV");
const[finishOpen,setFinishOpen]=useState(false),[searchChat,setSearchChat]=useState(""),[typing]=useState(true),[audio,setAudio]=useState(false);

useEffect(()=>{
  const h=(e)=>{if(e.ctrlKey&&e.key.toLowerCase()==="k"){e.preventDefault();document.querySelector(".search input")?.focus()}if(e.ctrlKey&&e.key==="Enter")send()};
  window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)
},[draft,activeId]);

const send=()=>{if(!draft.trim())return;sendMessage(activeId,draft);setDraft("")};
const note=()=>{const t=window.prompt("Digite a nota interna:");addNote(activeId,t)};
const reply=(text)=>setDraft(`Respondendo: ${text.slice(0,40)} — `);
const ticketFromMessage=(text)=>createTicket({client:active.company,title:text.slice(0,42),priority:active.priority,owner:active.agent,deadline:"Hoje 17:00"});

return <>
<div className={"workspace "+(detailsOpen?"details-open":"details-closed")}>
<ConversationListPanel filtered={filtered} activeId={activeId} query={query} setQuery={setQuery} mobile={mobile} onSelect={(id)=>{setActiveId(id);setMobile("chat")}}/>
<ChatPanel
  active={active}
  mobile={mobile} setMobile={setMobile}
  detailsOpen={detailsOpen} setDetailsOpen={setDetailsOpen}
  searchChat={searchChat} setSearchChat={setSearchChat}
  setPage={setPage}
  onNote={note}
  quickOpen={quickOpen} setQuickOpen={setQuickOpen}
  quickCat={quickCat} setQuickCat={setQuickCat}
  quick={getQuickReplies()}
  messages={messages[activeId]||[]}
  summaryOpen={summaryOpen} setSummaryOpen={setSummaryOpen}
  typing={typing}
  draft={draft} setDraft={setDraft}
  onSend={send}
  audio={audio} setAudio={setAudio}
  onReply={reply}
  onNewTicket={ticketFromMessage}
  onFinish={()=>setFinishOpen(true)}
/>
<ClientDetailsPanel active={active} mobile={mobile} setMobile={setMobile} tab={tab} setTab={setTab} setPage={setPage}/>
</div>
{finishOpen&&<FinishServiceModal onClose={()=>setFinishOpen(false)}/>}
</>
}
