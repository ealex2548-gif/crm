import { apiFetch } from "./apiClient";

export async function getAuditLogs() {
  return apiFetch("/api/audit-logs");
}
