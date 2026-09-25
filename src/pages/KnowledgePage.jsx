import{useEffect,useState}from"react";
import{Plus,X,BookOpen,Pencil,Trash2,Search}from"lucide-react";
import{Badge}from"../components/common/Badge";
import{getKnowledgeBase,saveArticle,deleteArticle}from"../services/knowledgeBaseService";

export function KnowledgePage({user}){
const canManage=user?.role==="ADMIN"||user?.role==="SUPERVISOR";
const[articles,setArticles]=useState([]);
const[query,setQuery]=useState("");
const[reading,setReading]=useState(null);
const[form,setForm]=useState(null); // {id?, category, title, body}
const[saving,setSaving]=useState(false);

const load=()=>getKnowledgeBase().then(setArticles);
useEffect(()=>{load()},[]);

const term=query.trim().toLowerCase();
const visible=articles.filter(a=>!term||`${a.category} ${a.title} ${a.body}`.toLowerCase().includes(term));
const categories=[...new Set(articles.map(a=>a.category))];

const save=async()=>{
if(!form.category.trim()||!form.title.trim()||!form.body.trim())return;
setSaving(true);
try{await saveArticle(form);setForm(null);setReading(null);await load()}
catch(e){window.alert(e.message)}
finally{setSaving(false)}
};
const remove=async(a)=>{
if(!window.confirm(`Apagar o artigo "${a.title}"?`))return;
try{await deleteArticle(a.id);setReading(null);await load()}catch(e){window.alert(e.message)}
};

return <div className="page">
<div className="page-head"><div><h2>Base de conhecimento</h2><p>Soluções prontas para o suporte.</p></div>{canManage&&<button className="primary" onClick={()=>setForm({category:"",title:"",body:""})}><Plus/>Novo artigo</button>}</div>
{articles.length>0&&<div className="search kb-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por título, categoria ou texto"/></div>}
<div className="kb-grid">{visible.map(a=><div className="kb-card" key={a.id}><Badge>{a.category}</Badge><h3>{a.title}</h3><p>{a.body.length>140?a.body.slice(0,140)+"…":a.body}</p><button onClick={()=>setReading(a)}>Ler artigo</button></div>)}</div>
{articles.length===0&&<p className="empty-hint">{canManage?"Nenhum artigo ainda. Clique em \"Novo artigo\" para criar o primeiro.":"Nenhum artigo cadastrado ainda."}</p>}
{articles.length>0&&visible.length===0&&<p className="empty-hint">Nenhum artigo encontrado para "{query}".</p>}

{reading&&!form&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setReading(null)}><div className="finish-modal kb-modal">
<div className="finish-head"><div><BookOpen/><span><strong>{reading.title}</strong><small>{reading.category}</small></span></div><button onClick={()=>setReading(null)}><X/></button></div>
<div className="kb-body">{reading.body}</div>
{canManage&&<div className="modal-actions"><button onClick={()=>remove(reading)}><Trash2/>Apagar</button><button className="confirm" onClick={()=>setForm({...reading})}><Pencil/>Editar</button></div>}
</div></div>}

{form&&<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&setForm(null)}><div className="finish-modal kb-modal">
<div className="finish-head"><div><BookOpen/><span><strong>{form.id?"Editar artigo":"Novo artigo"}</strong><small>Visível para toda a equipe.</small></span></div><button onClick={()=>setForm(null)}><X/></button></div>
<label>Categoria<input list="kb-cats" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Ex.: PDV, Fiscal, Impressão"/></label>
<datalist id="kb-cats">{categories.map(c=><option key={c} value={c}/>)}</datalist>
<label>Título<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Ex.: Impressora térmica não comunica"/></label>
<label>Solução<textarea className="kb-textarea" value={form.body} onChange={e=>setForm({...form,body:e.target.value})} placeholder="Passo a passo da solução..."/></label>
<div className="modal-actions"><button onClick={()=>setForm(null)}>Cancelar</button><button className="confirm" disabled={saving} onClick={save}>{saving?"Salvando...":"Salvar"}</button></div>
</div></div>}
</div>
}
