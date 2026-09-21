import{FEATURES}from"../../config/features";
import{Plus,Smile,Paperclip,Camera,AudioLines,Pause,Send,Mic}from"lucide-react";

export function Composer({draft,setDraft,onSend,audio,setAudio}){
return <footer className="composer">{FEATURES.productivity&&<button className="plus" title="Anexos"><Plus/></button>}<div className="input"><Smile/><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onSend()} placeholder="Digite uma mensagem"/>{FEATURES.productivity&&<><Paperclip/><Camera/></>}</div>{FEATURES.productivity&&<button className={"audio "+(audio?"recording":"")} onClick={()=>setAudio(v=>!v)}>{audio?<Pause/>:<AudioLines/>}</button>}<button className="send" onClick={onSend}>{draft.trim()?<Send/>:<Mic/>}</button></footer>
}
