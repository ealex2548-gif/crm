import{useState}from"react";
import{CircleAlert,X}from"lucide-react";

const REASONS=["Resolvido","Orientação concluída","Sem retorno","Encaminhado"];

// Finaliza a conversa (status Finalizado). Motivo e solução ficam registrados
// como nota interna, para o histórico do cliente.
export function FinishServiceModal({onConfirm,onClose}){
const[reason,setReason]=useState(REASONS[0]),[solution,setSolution]=useState("");
const[saving,setSaving]=useState(false);
const confirm=async()=>{
setSaving(true);
try{await onConfirm({reason,solution:solution.trim()});onClose()}
catch(e){window.alert(e.message)}
finally{setSaving(false)}
};
return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><div className="finish-modal"><div className="finish-head"><div><CircleAlert/><span><strong>Finalizar atendimento</strong><small>Registre o resultado antes de encerrar.</small></span></div><button onClick={onClose}><X/></button></div>
<label>Motivo<select value={reason} onChange={e=>setReason(e.target.value)}>{REASONS.map(r=><option key={r}>{r}</option>)}</select></label>
<label>Solução aplicada (opcional)<textarea value={solution} onChange={e=>setSolution(e.target.value)} placeholder="Descreva a solução..."/></label>
<div className="modal-actions"><button onClick={onClose}>Cancelar</button><button className="confirm" disabled={saving} onClick={confirm}>{saving?"Finalizando...":"Finalizar"}</button></div></div></div>
}
