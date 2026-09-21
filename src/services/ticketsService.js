import { apiFetch } from "./apiClient";
import { priorityToDisplay, priorityToApi, ticketStatusToDisplay, ticketStatusToApi } from "./enumMappers";

function mapTicket(t) {
  return {
    id: "#" + t.id.slice(-4).toUpperCase(),
    ticketId: t.id,
    contactId: t.contact?.id ?? null,
    client: t.contact?.company || t.contact?.name || "",
    title: t.title,
    status: ticketStatusToDisplay(t.status),
    priority: priorityToDisplay(t.priority),
    owner: t.owner?.name ?? "Sem responsável",
    deadline: t.deadline
      ? new Date(t.deadline).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
      : "A definir",
  };
}

export async function getTickets() {
  const tickets = await apiFetch("/api/tickets");
  return tickets.map(mapTicket);
}

export async function createTicket({ contactId, conversationId, title, priority, ownerId, deadline }) {
  const ticket = await apiFetch("/api/tickets", {
    method: "POST",
    body: JSON.stringify({
      contactId,
      conversationId,
      title,
      priority: priorityToApi(priority),
      ownerId,
      deadline,
    }),
  });
  return mapTicket(ticket);
}

export async function updateTicketStatus(ticketId, status) {
  const ticket = await apiFetch(`/api/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: ticketStatusToApi(status) }),
  });
  return mapTicket(ticket);
}
