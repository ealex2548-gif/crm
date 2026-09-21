import { io } from "socket.io-client";
import { getStoredToken } from "./authService";

// undefined faz o socket.io-client conectar na própria origem da página —
// certo para produção atrás do Caddy. Em dev, aponta pro backend em :3001.
const SOCKET_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:3001" : undefined);

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token: getStoredToken() },
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  s.auth = { token: getStoredToken() };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
