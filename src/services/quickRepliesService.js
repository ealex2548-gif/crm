import { apiFetch } from "./apiClient";

// Lista crua ({ id, category, body }) — o agrupamento por categoria é feito na tela.
export async function getQuickReplies() {
  return apiFetch("/api/quick-replies");
}

export async function saveQuickReply({ id, category, body }) {
  return apiFetch(id ? `/api/quick-replies/${id}` : "/api/quick-replies", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify({ category, body }),
  });
}

export async function deleteQuickReply(id) {
  await apiFetch(`/api/quick-replies/${id}`, { method: "DELETE" });
}
