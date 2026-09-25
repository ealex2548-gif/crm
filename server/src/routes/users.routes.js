import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listAgents, createUser, listAllUsers, setUserActive, setUserSector } from "../controllers/users.controller.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get("/", asyncHandler(listAgents));
usersRouter.get("/all", requireRole("ADMIN", "SUPERVISOR"), asyncHandler(listAllUsers));
usersRouter.post("/", requireRole("ADMIN"), asyncHandler(createUser));
usersRouter.patch("/:id/active", requireRole("ADMIN", "SUPERVISOR"), asyncHandler(setUserActive));
usersRouter.patch("/:id/sector", requireRole("ADMIN", "SUPERVISOR"), asyncHandler(setUserSector));
