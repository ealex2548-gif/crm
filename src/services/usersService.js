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

export async function getAllUsers() {
  return apiFetch("/api/users/all");
}

export async function setUserActive(userId, active) {
  return apiFetch(`/api/users/${userId}/active`, {
    method: "PATCH",
    body: JSON.stringify({ active }),
  });
}
