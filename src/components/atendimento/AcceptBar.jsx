import{useState}from"react";
import{Lock,Play,ArrowLeftRight,UserPlus}from"lucide-react";

// No lugar da barra de digitar enquanto ninguém iniciou o atendimento (ou,
// para o atendente, quando um colega já está atendendo): dá para ler tudo,
// mas responder só depois de "Iniciar atendimento".
export function AcceptBar({active,takenBy,mine,onAccept,onTransfer,onJoin}){
const pending=active.status==="Aguardando aceite";
const[busy,setBusy]=useState(false);
const run=(fn)=>async()=>{setBusy(true);try{await fn()}catch(e){window.alert(e.message)}finally{setBusy(false)}};
const accept=run(onAccept);
// Conversa com outra pessoa: só acompanha. Gestão pode "Participar do atendimento".
if(takenBy)return <footer className="accept-bar"><span className="accept-info"><Lock/>{pending?<>Transferida para <b>{takenBy}</b> — aguardando aceite</>:<>Em atendimento por <b>{takenBy}</b></>}</span>{onJoin&&<div className="accept-actions"><button type="button" className="confirm" disabled={busy} onClick={run(onJoin)}><UserPlus/>{busy?"Entrando...":"Participar do atendimento"}</button></div>}</footer>;
return <footer className="accept-bar">
<span className="accept-info"><Lock/>{pending?(mine?<>Transferida para você</>:<>Transferida para <b>{active.agent}</b> — aguardando aceite</>):active.status==="Finalizado"?"Atendimento finalizado":"Aguardando atendimento"}</span>
<div className="accept-actions">
<button type="button" onClick={onTransfer}><ArrowLeftRight/>Transferir</button>
<button type="button" className="confirm" disabled={busy} onClick={accept}><Play/>{busy?"Iniciando...":pending&&!mine?"Assumir atendimento":"Iniciar atendimento"}</button>
</div>
</footer>
}
