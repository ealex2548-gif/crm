import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { conversationsRouter } from "./routes/conversations.routes.js";
import { ticketsRouter } from "./routes/tickets.routes.js";
import { sectorsRouter, quickRepliesRouter, knowledgeArticlesRouter } from "./routes/catalog.routes.js";
import { usersRouter } from "./routes/users.routes.js";
import { auditLogRouter } from "./routes/auditLog.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { reportsRouter } from "./routes/reports.routes.js";
import { webhooksRouter } from "./routes/webhooks.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  // Guarda o corpo bruto (antes do parse) em req.rawBody — necessário para
  // validar a assinatura HMAC (X-BSP-Signature) dos webhooks da CoverCut.
  app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

  // helmet marca recursos como same-origin por padrão; sem isso o frontend
  // (outra origem em dev) não consegue exibir as imagens/anexos enviados.
  app.use(
    "/uploads",
    (req, res, next) => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      next();
    },
    express.static(path.resolve(process.cwd(), "data", "uploads"))
  );

  app.use("/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/conversations", conversationsRouter);
  app.use("/api/tickets", ticketsRouter);
  app.use("/api/sectors", sectorsRouter);
  app.use("/api/quick-replies", quickRepliesRouter);
  app.use("/api/knowledge-articles", knowledgeArticlesRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/audit-logs", auditLogRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/webhooks", webhooksRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
