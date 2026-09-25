import{useEffect,useMemo,useRef,useState}from"react";
import{Mic,Square,Trash2}from"lucide-react";
import{AudioPlayer}from"./AudioPlayer";

const fmt=(s)=>`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

// Grava um áudio curto no navegador (nota de voz interna). O navegador só
// libera o microfone em HTTPS (ou localhost) — sem isso, explica em vez de falhar.
export function AudioRecorder({blob,setBlob}){
const[recording,setRecording]=useState(false);
const[seconds,setSeconds]=useState(0);
const[error,setError]=useState(null);
const recRef=useRef(null),chunks=useRef([]),timer=useRef(null);
const url=useMemo(()=>blob?URL.createObjectURL(blob):null,[blob]);
useEffect(()=>()=>{if(url)URL.revokeObjectURL(url)},[url]);
useEffect(()=>()=>{clearInterval(timer.current);recRef.current?.stream.getTracks().forEach(t=>t.stop())},[]);

const available=typeof window!=="undefined"&&window.isSecureContext&&navigator.mediaDevices?.getUserMedia&&window.MediaRecorder;

const start=async()=>{
setError(null);
try{
const stream=await navigator.mediaDevices.getUserMedia({audio:true});
const type=MediaRecorder.isTypeSupported("audio/webm;codecs=opus")?"audio/webm;codecs=opus":"";
const rec=new MediaRecorder(stream,type?{mimeType:type}:undefined);
chunks.current=[];
rec.ondataavailable=(e)=>e.data.size&&chunks.current.push(e.data);
rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());setBlob(new Blob(chunks.current,{type:"audio/webm"}))};
rec.start();recRef.current=rec;
setSeconds(0);setRecording(true);
timer.current=setInterval(()=>setSeconds(s=>s+1),1000);
}catch{setError("Não foi possível usar o microfone. Verifique a permissão do navegador.")}
};
const stop=()=>{clearInterval(timer.current);recRef.current?.stop();setRecording(false)};

if(!available)return <p className="rec-hint">🎤 Gravar áudio precisa de conexão segura (HTTPS). Vai funcionar quando o CRM tiver um domínio — por enquanto, use o texto.</p>;
if(blob)return <div className="rec-row"><AudioPlayer src={url}/><button type="button" className="rec-btn" title="Descartar áudio" onClick={()=>setBlob(null)}><Trash2/></button></div>;
return <div className="rec-row">
{recording?<><span className="rec-dot"/><span className="rec-time">Gravando {fmt(seconds)}</span><button type="button" className="rec-btn stop" onClick={stop}><Square/>Parar</button></>
:<button type="button" className="rec-btn" onClick={start}><Mic/>Gravar áudio</button>}
{error&&<span className="rec-error">{error}</span>}
</div>
}
