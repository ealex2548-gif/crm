import{X}from"lucide-react";

export function QuickRepliesPopover({quick,quickCat,setQuickCat,onPick,onClose}){
return <div className="quick-popover"><div className="quick-head"><strong>Respostas rápidas</strong><button onClick={onClose}><X/></button></div><div className="quick-cats">{Object.keys(quick).map(k=><button className={k===quickCat?"active":""} onClick={()=>setQuickCat(k)} key={k}>{k}</button>)}</div><div className="quick-list">{quick[quickCat].map(q=><button key={q} onClick={()=>onPick(q)}>{q}</button>)}</div></div>
}
