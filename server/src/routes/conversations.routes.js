import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listConversations,
  getConversation,
  updateConversation,
  listMessages,
  createMessage,
} from "../controllers/conversations.controller.js";

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);

conversationsRouter.get("/", asyncHandler(listConversations));
conversationsRouter.get("/:id", asyncHandler(getConversation));
conversationsRouter.patch("/:id", asyncHandler(updateConversation));
conversationsRouter.get("/:id/messages", asyncHandler(listMessages));
conversationsRouter.post("/:id/messages", asyncHandler(createMessage));
