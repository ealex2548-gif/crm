import{useMemo,useState}from"react";
import{getContacts}from"../services/contactsService";

export function useConversations(){
const[contacts]=useState(getContacts);
const[activeId,setActiveId]=useState(contacts[0]?.id);
const[query,setQuery]=useState("");
const active=contacts.find(c=>c.id===activeId)||contacts[0];
const filtered=useMemo(()=>contacts.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())||c.company.toLowerCase().includes(query.toLowerCase())),[contacts,query]);
return{contacts,active,activeId,setActiveId,query,setQuery,filtered};
}
