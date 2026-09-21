import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listAuditLogs } from "../controllers/auditLog.controller.js";

export const auditLogRouter = Router();

auditLogRouter.use(requireAuth, requireRole("ADMIN", "SUPERVISOR"));
auditLogRouter.get("/", asyncHandler(listAuditLogs));
