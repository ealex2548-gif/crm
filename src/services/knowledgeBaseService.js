import { apiFetch } from "./apiClient";

export async function getKnowledgeBase() {
  return apiFetch("/api/knowledge-articles");
}

export async function saveArticle({ id, category, title, body }) {
  return apiFetch(id ? `/api/knowledge-articles/${id}` : "/api/knowledge-articles", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify({ category, title, body }),
  });
}

export async function deleteArticle(id) {
  await apiFetch(`/api/knowledge-articles/${id}`, { method: "DELETE" });
}
