import{useEffect,useRef,useState}from"react";
import{Play,Pause,Mic}from"lucide-react";

const SPEEDS=[1,1.5,2];
const fmt=(s)=>!isFinite(s)?"0:00":`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;

// Player no estilo WhatsApp. O áudio toca por um objeto Audio fora da página
// (sem <audio> no DOM) — assim extensões de "acelerar vídeo" do navegador não
// sobrepõem os controles delas em cima da mensagem.
// meta: horário + tiques da mensagem, exibidos na linha de baixo (à direita da duração).
export function AudioPlayer({src,meta}){
const audioRef=useRef(null);
const[playing,setPlaying]=useState(false);
const[time,setTime]=useState(0),[duration,setDuration]=useState(0);
const[speed,setSpeed]=useState(1);

useEffect(()=>{
const a=new Audio(src);
a.preload="metadata";
audioRef.current=a;
const onMeta=()=>setDuration(a.duration);
const onTime=()=>setTime(a.currentTime);
const onEnd=()=>{setPlaying(false);setTime(0);a.currentTime=0};
a.addEventListener("loadedmetadata",onMeta);
a.addEventListener("durationchange",onMeta);
a.addEventListener("timeupdate",onTime);
a.addEventListener("ended",onEnd);
return()=>{a.pause();a.removeEventListener("loadedmetadata",onMeta);a.removeEventListener("durationchange",onMeta);a.removeEventListener("timeupdate",onTime);a.removeEventListener("ended",onEnd);audioRef.current=null};
},[src]);

// O evento timeupdate só dispara ~4x por segundo (barra "aos pulos"); enquanto
// toca, acompanha a posição a cada quadro para a barra deslizar suave.
useEffect(()=>{
if(!playing)return;
let frame;
const tick=()=>{if(audioRef.current)setTime(audioRef.current.currentTime);frame=requestAnimationFrame(tick)};
frame=requestAnimationFrame(tick);
return()=>cancelAnimationFrame(frame);
},[playing]);

const toggle=()=>{
const a=audioRef.current;if(!a)return;
if(playing){a.pause();setPlaying(false)}
else{a.playbackRate=speed;a.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false))}
};
const seek=(e)=>{const a=audioRef.current;if(!a||!duration)return;a.currentTime=Number(e.target.value);setTime(a.currentTime)};
const cycleSpeed=()=>{const next=SPEEDS[(SPEEDS.indexOf(speed)+1)%SPEEDS.length];setSpeed(next);if(audioRef.current)audioRef.current.playbackRate=next};

return <div className="audio-player">
<button type="button" className="audio-play" onClick={toggle} title={playing?"Pausar":"Ouvir"}>{playing?<Pause/>:<Play/>}</button>
<div className="audio-track">
<input type="range" min={0} max={duration||0} step="any" value={Math.min(time,duration||0)} onChange={seek} style={{"--pct":`${duration?(time/duration)*100:0}%`}}/>
</div>
{/* Como no WhatsApp: parado mostra o microfone; tocando, a velocidade. */}
<div className="audio-side">{playing||speed!==1?<button type="button" className="audio-speed" onClick={cycleSpeed} title="Velocidade">{String(speed).replace(".",",")}x</button>:<span className="audio-mic"><Mic/></span>}</div>
<div className="audio-foot"><span className="audio-time">{fmt(playing||time?time:duration)}</span>{meta}</div>
</div>
}
