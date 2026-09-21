import { Server } from "socket.io";
import { verifyToken } from "../utils/jwt.js";
import { env } from "../config/env.js";

/**
 * Eventos previstos (a implementar junto com as rotas de conversas/tickets):
 *   server -> client: "message:new", "conversation:updated", "ticket:updated"
 *   client -> server: "conversation:join", "conversation:typing"
 */
export function createWebSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.corsOrigin },
  });

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
