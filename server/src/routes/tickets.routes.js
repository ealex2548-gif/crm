import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listTickets, createTicket, updateTicket } from "../controllers/tickets.controller.js";

export const ticketsRouter = Router();

ticketsRouter.use(requireAuth);

ticketsRouter.get("/", asyncHandler(listTickets));
ticketsRouter.post("/", asyncHandler(createTicket));
ticketsRouter.patch("/:id", asyncHandler(updateTicket));
