import{useEffect,useState}from"react";
import{apiFetch}from"../../../services/apiClient";
import{getAgents}from"../../../services/usersService";

const STATUS_OPTIONS=["Em atendimento","Aguardando cliente","Aguardando equipe","Finalizado"];
const PRIORITY_OPTIONS=["Alta","Normal","Urgente"];

export function ClienteTab({active,onUpdate}){
const[agents,setAgents]=useState([]);
const[sectors,setSectors]=useState([]);

useEffect(()=>{
getAgents().then(setAgents);
apiFetch("/api/sectors").then(setSectors);
},[]);

const handleAgentChange=(e)=>{
const agent=agents.find(a=>a.name===e.target.value);
// Como na janela Transferir: o setor acompanha o do atendente escolhido.
onUpdate?.({assignedAgentId:agent?.id ?? null,...(agent?.sectorId&&{sectorId:agent.sectorId})});
};
const handleSectorChange=(e)=>{
const sector=sectors.find(s=>s.name===e.target.value);
onUpdate?.({sectorId:sector?.id ?? null});
};

return <><section><h3>Atendimento atual</h3><label>Responsável<select value={active.agent} onChange={handleAgentChange}><option>Sem responsável</option>{agents.map(a=><option key={a.id}>{a.name}</option>)}</select></label><label>Setor<select value={active.sector} onChange={handleSectorChange}><option value="—">Sem setor</option>{sectors.map(s=><option key={s.id}>{s.name}</option>)}</select></label><label>Status<select value={active.status} onChange={(e)=>onUpdate?.({status:e.target.value})}>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}</select></label><label>Prioridade<select value={active.priority} onChange={(e)=>onUpdate?.({priority:e.target.value})}>{PRIORITY_OPTIONS.map(p=><option key={p}>{p}</option>)}</select></label></section><section><h3>Empresa</h3><label>Empresa<input value={active.company} readOnly/></label><label>Telefone<input value={active.phone} readOnly/></label><label>Cidade<input value={active.city} readOnly/></label><label>Plano<input value={active.plan} readOnly/></label></section></>
}
