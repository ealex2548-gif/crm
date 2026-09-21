import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getReportsSummary } from "../controllers/reports.controller.js";

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requireRole("ADMIN", "SUPERVISOR"));
reportsRouter.get("/summary", asyncHandler(getReportsSummary));
