import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me, changeMyPassword } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const authRouter = Router();

// 10 tentativas por IP a cada 15min — não trava o uso normal, mas
// inviabiliza força bruta de senha.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
});

authRouter.post("/login", loginLimiter, asyncHandler(login));
authRouter.get("/me", requireAuth, asyncHandler(me));
authRouter.patch("/me/password", requireAuth, asyncHandler(changeMyPassword));
