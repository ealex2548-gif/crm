import { apiFetch } from "./apiClient";
import { priorityToDisplay, priorityToApi, conversationStatusToDisplay, conversationStatusToApi } from "./enumMappers";
import { formatClock, formatElapsed, formatSla } from "../utils/formatTime";

function initialsOf(name) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

// Achata a conversa vinda da API na mesma forma "contato" que os componentes
// de Atendimento já esperavam desde o protótipo — assim ConversationItem,
// ChatHeader, ClientDetailsPanel etc. não precisam mudar.
function mapConversation(conversation) {
  const lastMessage = conversation.lastMessage;
  return {
    id: conversation.id,
    contactId: conversation.contact.id,
    name: conversation.contact.name,
    initials: initialsOf(conversation.contact.name),
    company: conversation.contact.company ?? "",
    phone: conversation.contact.phone,
    preview: lastMessage ? (lastMessage.type === "NOTE" ? "📝 Nota interna" : lastMessage.body) : "",
    time: formatClock(lastMessage?.createdAt ?? conversation.createdAt),
    sector: conversation.sector?.name ?? "—",
    sectorId: conversation.sector?.id ?? null,
    priority: priorityToDisplay(conversation.priority),
    agent: conversation.assignedAgent?.name ?? "Sem responsável",
    assignedAgentId: conversation.assignedAgent?.id ?? null,
    sla: formatSla(conversation.sla),
    slaStatus: conversation.sla?.status ?? "ok",
    unread: conversation.unreadCount,
    online: false,
    city: conversation.contact.city ?? "",
    plan: conversation.contact.plan ?? "",
    version: conversation.contact.pdvVersion ?? "",
    terminals: conversation.contact.pdvTerminals ?? "",
    db: conversation.contact.pdvDatabase ?? "",
    waiting: formatElapsed(lastMessage?.createdAt ?? conversation.createdAt),
    hasNote: false,
    status: conversationStatusToDisplay(conversation.status),
  };
}

export async function getConversations() {
  const conversations = await apiFetch("/api/conversations");
  return conversations.map(mapConversation);
}

export async function updateConversation(id, patch) {
  const body = { ...patch };
  if (body.priority) body.priority = priorityToApi(body.priority);
  if (body.status) body.status = conversationStatusToApi(body.status);
  const conversation = await apiFetch(`/api/conversations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return mapConversation(conversation);
}

// "Iniciar atendimento": fica com a conversa (409 se outra pessoa aceitou antes).
export async function acceptConversation(id) {
  const conversation = await apiFetch(`/api/conversations/${id}/accept`, { method: "POST" });
  return mapConversation(conversation);
}

export async function setConversationRead(id, read) {
  await apiFetch(`/api/conversations/${id}/read`, { method: "POST", body: JSON.stringify({ read }) });
}
