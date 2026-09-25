import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listSectors,
  listQuickReplies,
  createQuickReply,
  updateQuickReply,
  deleteQuickReply,
  listKnowledgeArticles,
  createKnowledgeArticle,
  updateKnowledgeArticle,
  deleteKnowledgeArticle,
} from "../controllers/catalog.controller.js";

// Todo mundo lê; só Supervisor/Admin cadastram, editam e apagam.
const canManage = requireRole("ADMIN", "SUPERVISOR");

export const sectorsRouter = Router();
sectorsRouter.use(requireAuth);
sectorsRouter.get("/", asyncHandler(listSectors));

export const quickRepliesRouter = Router();
quickRepliesRouter.use(requireAuth);
quickRepliesRouter.get("/", asyncHandler(listQuickReplies));
quickRepliesRouter.post("/", canManage, asyncHandler(createQuickReply));
quickRepliesRouter.put("/:id", canManage, asyncHandler(updateQuickReply));
quickRepliesRouter.delete("/:id", canManage, asyncHandler(deleteQuickReply));

export const knowledgeArticlesRouter = Router();
knowledgeArticlesRouter.use(requireAuth);
knowledgeArticlesRouter.get("/", asyncHandler(listKnowledgeArticles));
knowledgeArticlesRouter.post("/", canManage, asyncHandler(createKnowledgeArticle));
knowledgeArticlesRouter.put("/:id", canManage, asyncHandler(updateKnowledgeArticle));
knowledgeArticlesRouter.delete("/:id", canManage, asyncHandler(deleteKnowledgeArticle));
