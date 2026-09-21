import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listAgents } from "../controllers/users.controller.js";

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get("/", asyncHandler(listAgents));
