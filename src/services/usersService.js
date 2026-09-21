import { apiFetch } from "./apiClient";

export async function getAgents() {
  return apiFetch("/api/users");
}

export async function createUser(payload) {
  return apiFetch("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
