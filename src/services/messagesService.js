import { apiFetch } from "./apiClient";

export function mapMessage(m) {
  return {
    id: m.id,
    side: m.type === "NOTE" ? "note" : m.direction === "IN" ? "in" : "out",
    text: m.body,
    time: new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

export async function getMessages(conversationId) {
  const messages = await apiFetch(`/api/conversations/${conversationId}/messages`);
  return messages.map(mapMessage);
}

export async function sendMessage(conversationId, text) {
  const message = await apiFetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body: text, type: "TEXT" }),
  });
  return mapMessage(message);
}

export async function addNote(conversationId, text) {
  const message = await apiFetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body: text, type: "NOTE" }),
  });
  return mapMessage(message);
}
