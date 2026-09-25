import{useEffect,useRef,useState}from"react";
import{Play,Pause,Mic}from"lucide-react";

const SPEEDS=[1,1.5,2];
const BARS=40;
const fmt=(s)=>!isFinite(s)?"0:00":`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;

// Forma de onda: lê o arquivo, mede o volume de cada um dos BARS trechos e
// normaliza (0..1). Guardado em cache por arquivo — a lista de mensagens
// re-renderiza bastante. Se o navegador não decodificar o formato, usa barras
// iguais (continua tocando normalmente).
const waveCache=new Map();
function loadWave(src){
if(!waveCache.has(src)){
waveCache.set(src,(async()=>{
const buf=await(await fetch(src)).arrayBuffer();
const Ctx=window.AudioContext||window.webkitAudioContext;
const ctx=new Ctx();
try{
const audio=await ctx.decodeAudioData(buf);
const data=audio.getChannelData(0),size=Math.max(1,Math.floor(data.length/BARS));
const peaks=Array.from({length:BARS},(_,i)=>{let sum=0;for(let j=i*size;j<(i+1)*size&&j<data.length;j++)sum+=data[j]*data[j];return Math.sqrt(sum/size)});
const max=Math.max(...peaks)||1;
return{peaks:peaks.map(p=>p/max),duration:audio.duration};
}finally{ctx.close()}
})().catch(()=>({peaks:Array(BARS).fill(.35),duration:0})));
}
return waveCache.get(src);
}

// Como no WhatsApp: só um áudio toca por vez — tocar outro pausa o anterior.
let currentAudio=null;

// Player no estilo WhatsApp. O áudio toca por um objeto Audio fora da página
// (sem <audio> no DOM) — assim extensões de "acelerar vídeo" do navegador não
// sobrepõem os controles delas em cima da mensagem.
// meta: horário + tiques da mensagem, exibidos na linha de baixo (à direita da duração).
export function AudioPlayer({src,meta}){
const audioRef=useRef(null),waveRef=useRef(null);
const[playing,setPlaying]=useState(false);
const[time,setTime]=useState(0),[duration,setDuration]=useState(0);
const[speed,setSpeed]=useState(1);
const[peaks,setPeaks]=useState(()=>Array(BARS).fill(.35));

useEffect(()=>{
const a=new Audio(src);
a.preload="metadata";
audioRef.current=a;
// Áudio de voz (ogg) às vezes vem com duração "Infinity" — usa a da onda.
const onMeta=()=>{if(isFinite(a.duration))setDuration(a.duration)};
const onTime=()=>setTime(a.currentTime);
const onEnd=()=>{setPlaying(false);setTime(0);a.currentTime=0};
const onPause=()=>setPlaying(false);
a.addEventListener("loadedmetadata",onMeta);
a.addEventListener("durationchange",onMeta);
a.addEventListener("timeupdate",onTime);
a.addEventListener("ended",onEnd);
a.addEventListener("pause",onPause);
let alive=true;
loadWave(src).then(w=>{if(!alive)return;setPeaks(w.peaks);if(w.duration)setDuration(d=>d||w.duration)});
return()=>{alive=false;a.pause();a.removeEventListener("loadedmetadata",onMeta);a.removeEventListener("durationchange",onMeta);a.removeEventListener("timeupdate",onTime);a.removeEventListener("ended",onEnd);a.removeEventListener("pause",onPause);if(currentAudio===a)currentAudio=null;audioRef.current=null};
},[src]);

// O evento timeupdate só dispara ~4x por segundo (barra "aos pulos"); enquanto
// toca, acompanha a posição a cada quadro para deslizar suave.
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
else{if(currentAudio&&currentAudio!==a)currentAudio.pause();currentAudio=a;a.playbackRate=speed;a.play().then(()=>setPlaying(true)).catch(()=>setPlaying(false))}
};
// Clicar/arrastar na onda pula para aquele ponto.
const seekTo=(clientX)=>{
const a=audioRef.current,el=waveRef.current;if(!a||!el||!duration)return;
const r=el.getBoundingClientRect();
a.currentTime=Math.min(1,Math.max(0,(clientX-r.left)/r.width))*duration;
setTime(a.currentTime);
};
const onPointerDown=(e)=>{e.currentTarget.setPointerCapture(e.pointerId);seekTo(e.clientX)};
const onPointerMove=(e)=>{if(e.buttons&1)seekTo(e.clientX)};
const cycleSpeed=()=>{const next=SPEEDS[(SPEEDS.indexOf(speed)+1)%SPEEDS.length];setSpeed(next);if(audioRef.current)audioRef.current.playbackRate=next};

const progress=duration?Math.min(1,time/duration):0;
return <div className="audio-player">
<button type="button" className="audio-play" onClick={toggle} title={playing?"Pausar":"Ouvir"}>{playing?<Pause/>:<Play/>}</button>
<div className="audio-track">
<div className="wave" ref={waveRef} onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
{peaks.map((p,i)=><span key={i} className={(i+.5)/BARS<=progress?"played":""} style={{height:`${Math.max(12,p*100)}%`}}/>)}
<i className="wave-dot" style={{left:`${progress*100}%`}}/>
</div>
</div>
{/* Como no WhatsApp: parado mostra o microfone; tocando, a velocidade. */}
<div className="audio-side">{playing||speed!==1?<button type="button" className="audio-speed" onClick={cycleSpeed} title="Velocidade">{String(speed).replace(".",",")}x</button>:<span className="audio-mic"><Mic/></span>}</div>
<div className="audio-foot"><span className="audio-time">{fmt(playing||time?time:duration)}</span>{meta}</div>
</div>
}
