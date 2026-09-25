import{useEffect,useState}from"react";
import{X,StickyNote,ArrowLeftRight,Ticket}from"lucide-react";
import{apiFetch}from"../../services/apiClient";
import{getAgents}from"../../services/usersService";
import{AudioRecorder}from"./AudioRecorder";

function Modal({icon:Icon,title,subtitle,onClose,children}){
return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="finish-modal"><div className="finish-head"><div><Icon/><span><strong>{title}</strong><small>{subtitle}</small></span></div><button onClick={onClose}><X/></button></div>{children}</div></div>
}

// Salva e fecha; se der erro, mostra e mantém a janela aberta.
function useSubmit(onSave,onClose){
const[saving,setSaving]=useState(false);
const submit=async(...args)=>{setSaving(true);try{await onSave(...args);onClose()}catch(e){window.alert(e.message)}finally{setSaving(false)}};
return[saving,submit];
}

// onSave({text,audio}): texto e/ou áudio gravado.
export function NoteModal({onSave,onClose}){
const[text,setText]=useState(""),[audio,setAudio]=useState(null);
const[saving,submit]=useSubmit(onSave,onClose);
return <Modal icon={StickyNote} title="Nota interna" subtitle="Fica só no CRM — o cliente não vê." onClose={onClose}>
<label>Nota<textarea autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="Ex.: cliente pediu retorno amanhã às 9h"/></label>
<AudioRecorder blob={audio} setBlob={setAudio}/>
<div className="modal-actions"><button onClick={onClose}>Cancelar</button><button className="confirm" disabled={(!text.trim()&&!audio)||saving} onClick={()=>submit({text:text.trim(),audio})}>{saving?"Salvando...":"Salvar nota"}</button></div>
</Modal>
}

export function TransferModal({active,onSave,onClose}){
const[agents,setAgents]=useState([]),[sectors,setSectors]=useState([]);
const[agentId,setAgentId]=useState(active.assignedAgentId??""),[sectorId,setSectorId]=useState(active.sectorId??"");
const[note,setNote]=useState(""),[audio,setAudio]=useState(null);
const[saving,submit]=useSubmit(onSave,onClose);
useEffect(()=>{getAgents().then(setAgents);apiFetch("/api/sectors").then(setSectors)},[]);
// Escolher o atendente já seleciona o setor em que ele está cadastrado (dá para trocar).
const pickAgent=(id)=>{setAgentId(id);const agent=agents.find(a=>a.id===id);if(agent?.sectorId)setSectorId(agent.sectorId)};
return <Modal icon={ArrowLeftRight} title="Transferir atendimento" subtitle={`Conversa com ${active.name}`} onClose={onClose}>
<label>Atendente<select value={agentId} onChange={e=>pickAgent(e.target.value)}><option value="">Sem responsável</option>{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
<label>Setor / fila<select value={sectorId} onChange={e=>setSectorId(e.target.value)}><option value="">Sem setor</option>{sectors.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
{/* Recado para quem vai atender — fica como nota interna antes da transferência. */}
<label>Nota interna (opcional)<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex.: cliente já pagou, só falta liberar a licença"/></label>
<AudioRecorder blob={audio} setBlob={setAudio}/>
<div className="modal-actions"><button onClick={onClose}>Cancelar</button><button className="confirm" disabled={saving} onClick={()=>submit({assignedAgentId:agentId||null,sectorId:sectorId||null},{text:note.trim(),audio})}>{saving?"Transferindo...":"Transferir"}</button></div>
</Modal>
}

export function NewTicketModal({active,defaultTitle="",onSave,onClose}){
const[title,setTitle]=useState(defaultTitle),[priority,setPriority]=useState(active.priority||"Normal");
const[saving,submit]=useSubmit(onSave,onClose);
return <Modal icon={Ticket} title="Novo ticket" subtitle={`Cliente: ${active.name}`} onClose={onClose}>
<label>Assunto<input autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: PDV não imprime cupom"/></label>
<label>Prioridade<select value={priority} onChange={e=>setPriority(e.target.value)}>{["Baixa","Normal","Alta","Urgente"].map(p=><option key={p}>{p}</option>)}</select></label>
<div className="modal-actions"><button onClick={onClose}>Cancelar</button><button className="confirm" disabled={!title.trim()||saving} onClick={()=>submit({title:title.trim(),priority})}>{saving?"Criando...":"Criar ticket"}</button></div>
</Modal>
}
