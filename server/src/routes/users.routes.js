import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listAgents, createUser } from "../controllers/users.controller.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get("/", asyncHandler(listAgents));
usersRouter.post("/", requireRole("ADMIN"), asyncHandler(createUser));
