import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  listSectors,
  listQuickReplies,
  listKnowledgeArticles,
} from "../controllers/catalog.controller.js";

export const sectorsRouter = Router();
sectorsRouter.use(requireAuth);
sectorsRouter.get("/", asyncHandler(listSectors));

export const quickRepliesRouter = Router();
quickRepliesRouter.use(requireAuth);
quickRepliesRouter.get("/", asyncHandler(listQuickReplies));

export const knowledgeArticlesRouter = Router();
knowledgeArticlesRouter.use(requireAuth);
knowledgeArticlesRouter.get("/", asyncHandler(listKnowledgeArticles));
