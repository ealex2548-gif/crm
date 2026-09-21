import { apiFetch } from "./apiClient";

export async function getQuickReplies() {
  const rows = await apiFetch("/api/quick-replies");
  const grouped = {};
  for (const { category, body } of rows) {
    (grouped[category] ??= []).push(body);
  }
  return grouped;
}
