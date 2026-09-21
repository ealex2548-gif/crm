import{initialTickets}from"../data/tickets";

export function getInitialTickets(){
return initialTickets;
}

export function getNextTicketId(existingCount){
return "#"+(2550+existingCount);
}
