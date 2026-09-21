import { apiFetch, setAuthToken } from "./apiClient";

const STORAGE_KEY = "seucrm.token";

export async function login(email, password) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.token);
  localStorage.setItem(STORAGE_KEY, data.token);
  return data.user;
}

export async function fetchCurrentUser() {
  return apiFetch("/api/auth/me");
}

export async function changeMyPassword(currentPassword, newPassword) {
  return apiFetch("/api/auth/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function restoreSession() {
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) setAuthToken(token);
  return token;
}

export function logout() {
  setAuthToken(null);
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEY);
}
