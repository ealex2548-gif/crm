import { apiFetch } from "./apiClient";

export async function getDashboardSummary() {
  return apiFetch("/api/dashboard/summary");
}
