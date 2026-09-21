import{useEffect,useState}from"react";
import{Plus}from"lucide-react";
import{Badge}from"../components/common/Badge";
import{getKnowledgeBase}from"../services/knowledgeBaseService";

export function KnowledgePage(){
const[knowledgeBase,setKnowledgeBase]=useState([]);
useEffect(()=>{getKnowledgeBase().then(setKnowledgeBase)},[]);
return <div className="page"><div className="page-head"><div><h2>Base de conhecimento</h2><p>Soluções prontas para o suporte.</p></div><button className="primary"><Plus/>Novo artigo</button></div><div className="kb-grid">{knowledgeBase.map(([c,t,d])=><div className="kb-card" key={t}><Badge>{c}</Badge><h3>{t}</h3><p>{d}</p><button>Ler artigo</button></div>)}</div></div>
}
