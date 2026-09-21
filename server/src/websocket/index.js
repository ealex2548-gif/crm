import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

let ioInstance;

/**
 * Instância do Socket.io usada pelos controllers para emitir eventos
 * (ex: "message:new" ao criar uma mensagem). É `undefined` até
 * createWebSocketServer rodar — por isso os controllers sempre chamam
 * com `getIO()?.emit(...)`.
 */
export function getIO() {
  return ioInstance;
}

/**
 * Eventos emitidos:
 *   "message:new"          -> sala "conversation:<id>"
 *   "conversation:updated" -> sala "conversation:<id>"
 *   "ticket:updated"       -> broadcast geral (Kanban/Tickets não têm sala própria ainda)
 * Eventos recebidos:
 *   "conversation:join" (conversationId) -> entra na sala da conversa
 */
export function createWebSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigin },
  });
  ioInstance = io;

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Token ausente"));
    try {
      socket.data.user = verifyToken(token);
      return next();
    } catch {
      return next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[ws] conectado: ${socket.data.user?.name ?? socket.id}`);

    socket.on("conversation:join", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[ws] desconectado: ${socket.data.user?.name ?? socket.id}`);
    });
  });

  return io;
}
