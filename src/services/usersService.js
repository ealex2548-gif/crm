import { apiFetch } from "./apiClient";

export async function getAgents() {
  return apiFetch("/api/users");
}
