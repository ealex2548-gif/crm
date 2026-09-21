import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboardSummary } from "../controllers/dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth, requireRole("ADMIN", "SUPERVISOR"));
dashboardRouter.get("/summary", asyncHandler(getDashboardSummary));
