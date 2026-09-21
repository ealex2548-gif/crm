import { useEffect, useState } from "react";
import { getTickets, createTicket as createTicketRequest, updateTicketStatus as updateTicketStatusRequest } from "../services/ticketsService";
import { getSocket } from "../services/socket";

export function useTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTickets()
      .then(setTickets)
      .finally(() => setLoading(false));

    const socket = getSocket();
    const onTicketUpdated = () => {
      getTickets().then(setTickets);
    };
    socket.on("ticket:updated", onTicketUpdated);
    return () => socket.off("ticket:updated", onTicketUpdated);
  }, []);

  const createTicket = async (payload) => {
    const ticket = await createTicketRequest(payload);
    setTickets((t) => [ticket, ...t]);
    return ticket;
  };

  const updateTicketStatus = async (ticketId, status) => {
    const ticket = await updateTicketStatusRequest(ticketId, status);
    setTickets((t) => t.map((x) => (x.ticketId === ticketId ? ticket : x)));
    return ticket;
  };

  return { tickets, loading, createTicket, updateTicketStatus };
}
