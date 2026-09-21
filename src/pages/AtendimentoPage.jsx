import{useMemo,useState,useEffect}from"react";
import{contacts}from"../data/contacts";
import{initialMessages}from"../data/messages";
import{quickReplies}from"../data/quickReplies";
import{ConversationListPanel}from"../components/atendimento/ConversationListPanel";
import{ChatPanel}from"../components/atendimento/ChatPanel";
import{ClientDetailsPanel}from"../components/atendimento/ClientDetailsPanel";
import{FinishServiceModal}from"../components/atendimento/FinishServiceModal";

export function AtendimentoPage({tickets,setTickets,setPage}){
const[activeId,setActiveId]=useState(1),[query,setQuery]=useState(""),[messages,setMessages]=useState(initialMessages),[draft,setDraft]=useState("");
const[detailsOpen,setDetailsOpen]=useState(true),[mobile,setMobile]=useState("list"),[tab,setTab]=useState("cliente");
const[summaryOpen,setSummaryOpen]=useState(true),[quickOpen,setQuickOpen]=useState(false),[quickCat,setQuickCat]=useState("PDV");
const[finishOpen,setFinishOpen]=useState(false),[searchChat,setSearchChat]=useState(""),[typing]=useState(true),[audio,setAudio]=useState(false);
const active=contacts.find(c=>c.id===activeId)||contacts[0];
const filtered=useMemo(()=>contacts.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())||c.company.toLowerCase().includes(query.toLowerCase())),[query]);

useEffect(()=>{
  const h=(e)=>{if(e.ctrlKey&&e.key.toLowerCase()==="k"){e.preventDefault();document.querySelector(".search input")?.focus()}if(e.ctrlKey&&e.key==="Enter")send()};
  window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)
},[draft,activeId]);

const send=()=>{const t=draft.trim();if(!t)return;setMessages(m=>({...m,[activeId]:[...(m[activeId]||[]),{id:Date.now(),side:"out",text:t,time:"agora"}]}));setDraft("")};
const note=()=>{const t=window.prompt("Digite a nota interna:");if(!t)return;setMessages(m=>({...m,[activeId]:[...(m[activeId]||[]),{id:Date.now(),side:"note",text:t,time:"equipe"}]}))};
const newTicket=(text="Novo chamado")=>setTickets(t=>[{id:"#"+(2550+t.length),client:active.company,title:text,status:"Novo",priority:active.priority,owner:active.agent,deadline:"Hoje 17:00"},...t]);
const reply=(text)=>setDraft(`Respondendo: ${text.slice(0,40)} — `);
const ticketFromMessage=(text)=>newTicket(text.slice(0,42));

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
  quick={quickReplies}
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
