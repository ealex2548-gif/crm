import{FEATURES}from"../../config/features";
import{CircleAlert,X}from"lucide-react";

export function FinishServiceModal({onClose}){
return <div className="modal-backdrop"><div className="finish-modal"><div className="finish-head"><div><CircleAlert/><span><strong>Finalizar atendimento</strong><small>Registre o resultado antes de encerrar.</small></span></div><button onClick={onClose}><X/></button></div><label>Motivo<select><option>Resolvido</option><option>Orientação concluída</option><option>Sem retorno</option><option>Encaminhado</option></select></label><label>Solução aplicada<textarea placeholder="Descreva a solução..."/></label>{FEATURES.management&&<label>Categoria<select><option>PDV</option><option>Fiscal</option><option>Impressão</option><option>Financeiro</option></select></label>}<label className="checkline"><input type="checkbox" defaultChecked/> Enviar avaliação</label><div className="modal-actions"><button onClick={onClose}>Cancelar</button><button className="confirm" onClick={onClose}>Finalizar</button></div></div></div>
}
