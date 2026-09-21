import{useState}from"react";
import{getInitialTickets,getNextTicketId}from"../services/ticketsService";

export function useTickets(){
const[tickets,setTickets]=useState(getInitialTickets);

const createTicket=(payload)=>setTickets(t=>[{id:getNextTicketId(t.length),status:"Novo",...payload},...t]);

return{tickets,setTickets,createTicket};
}
