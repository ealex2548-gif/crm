import { apiFetch } from "./apiClient";

export async function getReportsSummary() {
  return apiFetch("/api/reports/summary");
}
