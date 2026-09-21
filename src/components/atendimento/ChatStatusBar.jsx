import{FEATURES}from"../../config/features";
import{CheckCircle2}from"lucide-react";

export function ChatStatusBar({active,onFinish}){
return <div className="statusbar"><span><b className={active.slaStatus==="breached"?"red":"green"}>SLA</b> {active.sla}</span><span><b className="orange">24h</b> 18h 42m</span><span><b>Atendente</b> {active.agent}</span><span><b className="red">Prioridade</b> {active.priority}</span>{FEATURES.management&&<span><b>Fila</b> {active.sector}</span>}<button className="finish-btn" onClick={onFinish}><CheckCircle2/>Finalizar</button></div>
}
