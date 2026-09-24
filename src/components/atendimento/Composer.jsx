import{useRef,useState}from"react";
import{Smile,Plus,FileText,Image,Camera,Send}from"lucide-react";

// Emojis mais usados em atendimento — sem biblioteca, só inserir no texto.
const EMOJIS=["😀","😊","😉","😂","🙂","😅","🤝","👍","👏","🙏","💪","👋","✅","❌","⚠️","📌","📎","📷","📄","💰","💳","🧾","📦","🚚","⏰","📅","☎️","💻","🖨️","🔧","⭐","❤️","🎉","🤔","😢","😬"];

// Mesmo layout do WhatsApp Web: [😊][+] [ campo ] [enviar]. O "+" abre o menu
// de anexos (Documento / Fotos e vídeos / Câmera). Sem microfone: o CRM ainda
// não grava áudio, então o botão da direita é sempre "enviar".
export function Composer({draft,setDraft,onSend,onSendFile}){
const docInputRef=useRef(null),mediaInputRef=useRef(null),cameraInputRef=useRef(null);
const textRef=useRef(null);
const[panel,setPanel]=useState(null); // "emoji" | "attach" | null

const toggle=(name)=>setPanel(p=>p===name?null:name);
const pick=(ref)=>{setPanel(null);ref.current?.click()};

const handleFile=(e)=>{
const file=e.target.files?.[0];
if(file)onSendFile?.(file);
e.target.value="";
};

// Insere o emoji onde está o cursor (ou no fim) e devolve o foco ao campo.
const addEmoji=(emoji)=>{
const el=textRef.current;
const start=el?.selectionStart??draft.length,end=el?.selectionEnd??draft.length;
setDraft(draft.slice(0,start)+emoji+draft.slice(end));
requestAnimationFrame(()=>{el?.focus();el?.setSelectionRange(start+emoji.length,start+emoji.length)});
};

const send=()=>{setPanel(null);onSend()};

return <footer className="composer">
{panel==="emoji"&&<div className="emoji-popover">{EMOJIS.map(e=><button key={e} type="button" onClick={()=>addEmoji(e)}>{e}</button>)}</div>}
{panel==="attach"&&<div className="attach-menu">
<button type="button" onClick={()=>pick(docInputRef)}><span className="doc"><FileText/></span>Documento</button>
<button type="button" onClick={()=>pick(mediaInputRef)}><span className="media"><Image/></span>Fotos e vídeos</button>
<button type="button" onClick={()=>pick(cameraInputRef)}><span className="camera"><Camera/></span>Câmera</button>
</div>}
<button type="button" className={"icon-btn "+(panel==="emoji"?"on":"")} title="Emojis" onClick={()=>toggle("emoji")}><Smile/></button>
<button type="button" className={"icon-btn "+(panel==="attach"?"on":"")} title="Anexar" onClick={()=>toggle("attach")}><Plus/></button>
<div className="input"><input ref={textRef} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} onFocus={()=>setPanel(p=>p==="attach"?null:p)} placeholder="Digite uma mensagem"/></div>
<button className="send" title="Enviar" disabled={!draft.trim()} onClick={send}><Send/></button>
<input ref={docInputRef} type="file" hidden onChange={handleFile} accept="application/pdf,audio/*"/>
<input ref={mediaInputRef} type="file" hidden onChange={handleFile} accept="image/*,video/mp4"/>
<input ref={cameraInputRef} type="file" hidden onChange={handleFile} accept="image/*" capture="environment"/>
</footer>
}
