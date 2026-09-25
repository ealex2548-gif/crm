import{useState,useEffect,useCallback}from"react";
import{useConversations}from"../hooks/useConversations";
import{useChatMessages}from"../hooks/useChatMessages";
import{getQuickReplies}from"../services/quickRepliesService";
import{updateConversation}from"../services/conversationsService";
import{getConversationTickets}from"../services/ticketsService";
import{getSocket}from"../services/socket";
import{ConversationListPanel}from"../components/atendimento/ConversationListPanel";
import{ChatPanel}from"../components/atendimento/ChatPanel";
import{ClientDetailsPanel}from"../components/atendimento/ClientDetailsPanel";
import{FinishServiceModal}from"../components/atendimento/FinishServiceModal";
import{NoteModal,TransferModal,NewTicketModal}from"../components/atendimento/ConversationModals";

export function AtendimentoPage({user,createTicket,setPage,ticketsPageTarget="tickets"}){
const{active,activeId,setActiveId,query,setQuery,filtered,loading}=useConversations();
const{messages,sendMessage,addNote,sendMedia}=useChatMessages(activeId);
const canManage=user?.role==="ADMIN"||user?.role==="SUPERVISOR";
const[quickReplies,setQuickReplies]=useState([]);
const[draft,setDraft]=useState("");
// Em telas menores o painel do cliente fica por cima da conversa — começa fechado.
const[detailsOpen,setDetailsOpen]=useState(()=>window.innerWidth>1380),[mobile,setMobile]=useState("list"),[tab,setTab]=useState("cliente");
const[quickOpen,setQuickOpen]=useState(false),[searchChat,setSearchChat]=useState("");
const[modal,setModal]=useState(null); // "note" | "transfer" | "ticket" | "finish"
const[ticketTitle,setTicketTitle]=useState("");
const[convTickets,setConvTickets]=useState([]);

const loadQuickReplies=useCallback(()=>getQuickReplies().then(setQuickReplies),[]);
useEffect(()=>{loadQuickReplies()},[loadQuickReplies]);

// Tickets da conversa aberta — o botão mostra o mais recente em aberto.
const conversationId=active?.id;
const loadTickets=useCallback(()=>{if(conversationId)getConversationTickets(conversationId).then(setConvTickets)},[conversationId]);
useEffect(()=>{
setConvTickets([]);loadTickets();
const socket=getSocket();
socket.on("ticket:updated",loadTickets);
return()=>socket.off("ticket:updated",loadTickets);
},[loadTickets]);
const ticket=convTickets.find(t=>t.status!=="Finalizado")??convTickets[0]??null;

useEffect(()=>{
  const h=(e)=>{if(e.ctrlKey&&e.key.toLowerCase()==="k"){e.preventDefault();document.querySelector(".search input")?.focus()}if(e.ctrlKey&&e.key==="Enter")send()};
  window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)
},[draft,activeId]);

// Falha no WhatsApp (ex.: janela de 24h vencida) volta o texto para o campo e avisa o atendente.
const send=()=>{if(!draft.trim()||!activeId)return;const text=draft;setDraft("");sendMessage(activeId,text).catch(e=>{setDraft(text);window.alert(e.message)})};
const reply=(text)=>setDraft(`Respondendo: ${text.slice(0,40)} — `);
const openTicketModal=(title="")=>{setTicketTitle(title);setModal("ticket")};
const onTicket=()=>ticket?setPage(ticketsPageTarget):openTicketModal();
const saveTicket=async({title,priority})=>{
await createTicket({contactId:active.contactId,conversationId:active.id,title,priority,ownerId:active.assignedAgentId,deadline:null});
loadTickets();
};
// Finalizar: registra motivo/solução como nota interna e fecha a conversa.
const finish=async({reason,solution})=>{
await addNote(activeId,`✅ Atendimento finalizado — ${reason}${solution?`: ${solution}`:""}`);
await updateConversation(activeId,{status:"Finalizado"});
};
const updateActiveConversation=(patch)=>activeId&&updateConversation(activeId,patch);
const sendFile=(file)=>activeId&&sendMedia(activeId,file).catch(e=>window.alert(e.message));

if(loading)return <div className="workspace"><section className="list-panel"><div className="list-head"><h1>Carregando...</h1></div></section></div>;
if(!active)return <div className="workspace"><section className="list-panel"><div className="list-head"><h1>Nenhuma conversa</h1></div></section></div>;

const close=()=>setModal(null);
return <>
<div className={"workspace "+(detailsOpen?"details-open":"details-closed")}>
<ConversationListPanel filtered={filtered} activeId={activeId} query={query} setQuery={setQuery} mobile={mobile} onSelect={(id)=>{setActiveId(id);setMobile("chat")}}/>
<ChatPanel
  active={active}
  mobile={mobile} setMobile={setMobile}
  detailsOpen={detailsOpen} setDetailsOpen={setDetailsOpen}
  searchChat={searchChat} setSearchChat={setSearchChat}
  setPage={setPage}
  ticket={ticket} onTicket={onTicket}
  onTransfer={()=>setModal("transfer")}
  onNote={()=>setModal("note")}
  quickOpen={quickOpen} setQuickOpen={setQuickOpen}
  quickReplies={quickReplies} canManage={canManage} onQuickChanged={loadQuickReplies}
  messages={messages}
  draft={draft} setDraft={setDraft}
  onSend={send}
  onSendFile={sendFile}
  onReply={reply}
  onNewTicket={(text)=>openTicketModal((text??"").slice(0,80))}
  onFinish={()=>setModal("finish")}
/>
<ClientDetailsPanel active={active} mobile={mobile} setMobile={setMobile} tab={tab} setTab={setTab} setPage={setPage} ticketsPageTarget={ticketsPageTarget} onUpdate={updateActiveConversation} onClose={()=>setDetailsOpen(false)}/>
</div>
{modal==="note"&&<NoteModal onSave={(text)=>addNote(activeId,text)} onClose={close}/>}
{modal==="transfer"&&<TransferModal active={active} onSave={(patch)=>updateConversation(activeId,patch)} onClose={close}/>}
{modal==="ticket"&&<NewTicketModal active={active} defaultTitle={ticketTitle} onSave={saveTicket} onClose={close}/>}
{modal==="finish"&&<FinishServiceModal onConfirm={finish} onClose={close}/>}
</>
}
