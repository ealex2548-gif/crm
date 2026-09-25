import { apiFetch, apiUpload, API_URL } from "./apiClient";

export function mapMessage(m) {
  return {
    id: m.id,
    side: m.type === "NOTE" ? "note" : m.direction === "IN" ? "in" : "out",
    text: m.body,
    mediaUrl: m.mediaUrl ? `${API_URL}${m.mediaUrl}` : null,
    time: new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    createdAt: m.createdAt,
    status: m.status,
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

export async function sendMedia(conversationId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const message = await apiUpload(`/api/conversations/${conversationId}/media`, formData);
  return mapMessage(message);
}

// Nota interna de voz (gravada no navegador) — fica só no CRM, não vai ao WhatsApp.
export async function addNoteAudio(conversationId, blob) {
  const formData = new FormData();
  formData.append("file", new File([blob], "nota.webm", { type: "audio/webm" }));
  return mapMessage(await apiUpload(`/api/conversations/${conversationId}/notes/media`, formData));
}
