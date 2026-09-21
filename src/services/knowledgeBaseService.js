import { apiFetch } from "./apiClient";

export async function getKnowledgeBase() {
  const articles = await apiFetch("/api/knowledge-articles");
  return articles.map((a) => [a.category, a.title, a.body]);
}
