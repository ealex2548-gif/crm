import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { upload } from "../middleware/upload.js";
import {
  listConversations,
  getConversation,
  updateConversation,
  listMessages,
  createMessage,
  uploadMedia,
  uploadNoteMedia,
  acceptConversation,
  setConversationRead,
} from "../controllers/conversations.controller.js";

export const conversationsRouter = Router();

conversationsRouter.use(requireAuth);

conversationsRouter.get("/", asyncHandler(listConversations));
conversationsRouter.get("/:id", asyncHandler(getConversation));
conversationsRouter.patch("/:id", asyncHandler(updateConversation));
conversationsRouter.post("/:id/accept", asyncHandler(acceptConversation));
conversationsRouter.post("/:id/read", asyncHandler(setConversationRead));
conversationsRouter.get("/:id/messages", asyncHandler(listMessages));
conversationsRouter.post("/:id/messages", asyncHandler(createMessage));
conversationsRouter.post("/:id/media", upload.single("file"), asyncHandler(uploadMedia));
conversationsRouter.post("/:id/notes/media", upload.single("file"), asyncHandler(uploadNoteMedia));
