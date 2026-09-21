import { io } from "socket.io-client";
import { getStoredToken } from "./authService";

const SOCKET_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

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
