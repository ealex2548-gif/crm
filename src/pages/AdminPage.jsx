import{useEffect,useState}from"react";
import{createUser}from"../services/usersService";
import{getAuditLogs}from"../services/auditLogService";
import{apiFetch}from"../services/apiClient";

const ROLE_LABELS={ADMIN:"Administrador",SUPERVISOR:"Supervisor",AGENT:"Atendente"};
const EMPTY_FORM={name:"",email:"",password:"",role:"AGENT",sectorId:""};

export function AdminPage({user}){
const isAdmin=user.role==="ADMIN";
const[sectors,setSectors]=useState([]);
const[form,setForm]=useState(EMPTY_FORM);
const[creating,setCreating]=useState(false);
const[message,setMessage]=useState(null);
const[logs,setLogs]=useState([]);
const[logsLoading,setLogsLoading]=useState(true);

useEffect(()=>{
if(isAdmin)apiFetch("/api/sectors").then(setSectors);
},[isAdmin]);

useEffect(()=>{
getAuditLogs().then((l)=>{setLogs(l);setLogsLoading(false)});
},[]);

const handleSubmit=async(e)=>{
e.preventDefault();
setCreating(true);
setMessage(null);
try{
await createUser({...form,sectorId:form.sectorId||undefined});
setMessage({type:"success",text:`Usuário ${form.name} criado com sucesso.`});
setForm(EMPTY_FORM);
getAuditLogs().then(setLogs);
}catch(err){
setMessage({type:"error",text:err.message});
}finally{
setCreating(false);
}
};

return <div className="page">
<div className="page-head"><div><h2>Administração</h2><p>Usuários e logs de auditoria.</p></div></div>

<div className="admin-sections">
{isAdmin&&<div className="panel">
<h3>Criar usuário</h3>
<form className="admin-form" onSubmit={handleSubmit}>
<label>Nome<input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} required/></label>
<label>E-mail<input type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} required/></label>
<label>Senha<input type="password" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} minLength={6} required/></label>
<label>Papel<select value={form.role} onChange={(e)=>setForm({...form,role:e.target.value})}>{Object.entries(ROLE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
<label>Setor<select value={form.sectorId} onChange={(e)=>setForm({...form,sectorId:e.target.value})}><option value="">Sem setor</option>{sectors.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
<button className="primary" type="submit" disabled={creating}>{creating?"Criando...":"Criar usuário"}</button>
</form>
{message&&<div className={message.type==="error"?"login-error":"admin-success"}>{message.text}</div>}
</div>}

<div className="panel">
<h3>Logs de auditoria</h3>
{logsLoading?<p>Carregando...</p>:<div className="audit-table">
<div className="audit-row th"><span>Data</span><span>Usuário</span><span>Ação</span><span>Registro</span><span>Detalhes</span></div>
{logs.map(l=><div className="audit-row" key={l.id}><span>{new Date(l.createdAt).toLocaleString("pt-BR")}</span><span>{l.user?.name??"—"}</span><span>{l.action}</span><span>{l.entityType}{l.entityId?` #${l.entityId.slice(-6)}`:""}</span><span className="audit-meta">{l.metadata?JSON.stringify(l.metadata):"—"}</span></div>)}
{logs.length===0&&<div className="audit-row"><span>Nenhum log ainda.</span></div>}
</div>}
</div>
</div>
</div>
}
