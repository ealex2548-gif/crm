import{useState}from"react";
import{getInitialMessages}from"../services/messagesService";

export function useChatMessages(){
const[messages,setMessages]=useState(getInitialMessages);

const sendMessage=(contactId,text)=>{
const t=text.trim();
if(!t)return;
setMessages(m=>({...m,[contactId]:[...(m[contactId]||[]),{id:Date.now(),side:"out",text:t,time:"agora"}]}));
};

const addNote=(contactId,text)=>{
const t=text?.trim();
if(!t)return;
setMessages(m=>({...m,[contactId]:[...(m[contactId]||[]),{id:Date.now(),side:"note",text:t,time:"equipe"}]}));
};

return{messages,sendMessage,addNote};
}
