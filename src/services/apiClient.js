// Em dev (vite dev server), frontend e backend rodam em portas diferentes,
// então por padrão fala com localhost:3001. Em produção (build servido
// atrás do proxy Caddy), backend e frontend ficam na mesma origem — string
// vazia = caminho relativo, sem precisar gravar IP/domínio no build.
export const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : "");

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(data?.error ?? `Erro ${res.status}`, res.status);
  }
  return data;
}

// Sem Content-Type manual — o browser define o boundary do multipart sozinho.
export async function apiUpload(path, formData) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    body: formData,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(data?.error ?? `Erro ${res.status}`, res.status);
  }
  return data;
}
