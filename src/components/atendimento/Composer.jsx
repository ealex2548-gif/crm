import{useRef}from"react";
import{FEATURES}from"../../config/features";
import{Plus,Smile,Paperclip,Camera,AudioLines,Pause,Send,Mic}from"lucide-react";

export function Composer({draft,setDraft,onSend,audio,setAudio,onSendFile}){
const fileInputRef=useRef(null);
const cameraInputRef=useRef(null);

const handleFile=(e)=>{
const file=e.target.files?.[0];
if(file)onSendFile?.(file);
e.target.value="";
};

return <footer className="composer">{FEATURES.productivity&&<button className="plus" title="Anexos" onClick={()=>fileInputRef.current?.click()}><Plus/></button>}<div className="input"><Smile/><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&onSend()} placeholder="Digite uma mensagem"/>{FEATURES.productivity&&<><button type="button" title="Anexar arquivo" onClick={()=>fileInputRef.current?.click()}><Paperclip/></button><button type="button" title="Enviar foto" onClick={()=>cameraInputRef.current?.click()}><Camera/></button></>}</div>{FEATURES.productivity&&<button className={"audio "+(audio?"recording":"")} onClick={()=>setAudio(v=>!v)}>{audio?<Pause/>:<AudioLines/>}</button>}<button className="send" onClick={onSend}>{draft.trim()?<Send/>:<Mic/>}</button>
<input ref={fileInputRef} type="file" hidden onChange={handleFile} accept="image/*,application/pdf,audio/*,video/mp4"/>
<input ref={cameraInputRef} type="file" hidden onChange={handleFile} accept="image/*" capture="environment"/>
</footer>
}
