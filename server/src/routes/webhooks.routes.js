import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { receiveCoverCutWebhook } from "../controllers/webhooks.controller.js";

export const webhooksRouter = Router();

// Sem requireAuth: a CoverCut chama isso direto (autenticado por
// assinatura HMAC, não por JWT — ver isValidSignature no controller).
webhooksRouter.post("/covercut", asyncHandler(receiveCoverCutWebhook));
