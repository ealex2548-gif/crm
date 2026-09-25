import{useMemo,useState}from"react";
import{X,Plus,Pencil,Trash2}from"lucide-react";
import{saveQuickReply,deleteQuickReply}from"../../services/quickRepliesService";

// Lista de respostas prontas por categoria. Clicar coloca o texto no campo.
// Supervisor/Admin (canManage) também criam, editam e apagam aqui mesmo.
export function QuickRepliesPopover({replies,canManage,onPick,onClose,onChanged}){
const categories=useMemo(()=>[...new Set(replies.map(r=>r.category))],[replies]);
const[cat,setCat]=useState(null);
const[form,setForm]=useState(null); // {id?, category, body}
const[saving,setSaving]=useState(false);
const current=cat&&categories.includes(cat)?cat:categories[0];
const list=replies.filter(r=>r.category===current);

const save=async()=>{
if(!form.category.trim()||!form.body.trim())return;
setSaving(true);
try{await saveQuickReply(form);setCat(form.category.trim());setForm(null);onChanged()}
catch(e){window.alert(e.message)}
finally{setSaving(false)}
};
const remove=async(r)=>{
if(!window.confirm("Apagar esta resposta rápida?"))return;
try{await deleteQuickReply(r.id);onChanged()}catch(e){window.alert(e.message)}
};

return <div className="quick-popover">
<div className="quick-head"><strong>Respostas rápidas</strong><span>{canManage&&!form&&<button title="Nova resposta" onClick={()=>setForm({category:current??"",body:""})}><Plus/></button>}<button title="Fechar" onClick={onClose}><X/></button></span></div>
{form?<div className="quick-form">
<label>Categoria<input list="quick-cats" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Ex.: PDV, Fiscal, Financeiro"/></label>
<datalist id="quick-cats">{categories.map(c=><option key={c} value={c}/>)}</datalist>
<label>Texto<textarea value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Texto que o atendente vai enviar"/></label>
<div className="modal-actions"><button onClick={()=>setForm(null)}>Cancelar</button><button className="confirm" disabled={saving} onClick={save}>{saving?"Salvando...":"Salvar"}</button></div>
</div>:<>
{categories.length>0&&<div className="quick-cats">{categories.map(k=><button className={k===current?"active":""} onClick={()=>setCat(k)} key={k}>{k}</button>)}</div>}
<div className="quick-list">
{list.map(r=><div className="quick-item" key={r.id}><button className="quick-text" onClick={()=>onPick(r.body)}>{r.body}</button>{canManage&&<span className="quick-tools"><button title="Editar" onClick={()=>setForm({id:r.id,category:r.category,body:r.body})}><Pencil/></button><button title="Apagar" onClick={()=>remove(r)}><Trash2/></button></span>}</div>)}
{replies.length===0&&<p className="empty-hint">{canManage?"Nenhuma resposta cadastrada. Clique em + para criar a primeira.":"Nenhuma resposta cadastrada ainda. Peça a um supervisor para cadastrar."}</p>}
</div></>}
</div>
}
