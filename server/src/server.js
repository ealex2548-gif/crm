import { createServer } from "node:http";
import { createApp } from "./app.js";
import { createWebSocketServer } from "./websocket/index.js";
import { env } from "./config/env.js";

const app = createApp();
const httpServer = createServer(app);
createWebSocketServer(httpServer);

httpServer.listen(env.port, () => {
  console.log(`[server] SeuCRM API rodando na porta ${env.port} (${env.nodeEnv})`);
});
