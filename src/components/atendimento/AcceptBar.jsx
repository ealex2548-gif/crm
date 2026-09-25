import{useState}from"react";
import{Lock,Play,ArrowLeftRight}from"lucide-react";

// No lugar da barra de digitar enquanto ninguém iniciou o atendimento (ou,
// para o atendente, quando um colega já está atendendo): dá para ler tudo,
// mas responder só depois de "Iniciar atendimento".
export function AcceptBar({active,takenBy,onAccept,onTransfer}){
const[busy,setBusy]=useState(false);
const accept=async()=>{setBusy(true);try{await onAccept()}catch(e){window.alert(e.message)}finally{setBusy(false)}};
if(takenBy)return <footer className="accept-bar"><span className="accept-info"><Lock/>Em atendimento por <b>{takenBy}</b></span></footer>;
return <footer className="accept-bar">
<span className="accept-info"><Lock/>{active.status==="Finalizado"?"Atendimento finalizado":"Aguardando atendimento"}</span>
<div className="accept-actions">
<button type="button" onClick={onTransfer}><ArrowLeftRight/>Transferir</button>
<button type="button" className="confirm" disabled={busy} onClick={accept}><Play/>{busy?"Iniciando...":"Iniciar atendimento"}</button>
</div>
</footer>
}
