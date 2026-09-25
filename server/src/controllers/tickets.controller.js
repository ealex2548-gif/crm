import { prisma } from "../config/prisma.js";
import { getIO } from "../websocket/index.js";
import { PRIORITIES, TICKET_STATUSES } from "../constants/enums.js";
import { recordAudit } from "../services/auditLog.js";

export async function listTickets(req, res) {
  // ?conversationId=... → só os tickets daquela conversa (botão do Atendimento).
  const { conversationId } = req.query;
  const tickets = await prisma.ticket.findMany({
    where: conversationId ? { conversationId: String(conversationId) } : undefined,
    include: { contact: true, owner: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(tickets);
}

export async function createTicket(req, res) {
  const { contactId, conversationId, title, priority = "NORMAL", ownerId, deadline } = req.body ?? {};
  if (!contactId || !title?.trim()) {
    return res.status(400).json({ error: "Informe contactId e title" });
  }
  if (!PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: "Prioridade inválida" });
  }

  const ticket = await prisma.ticket.create({
    data: {
      contactId,
      conversationId,
      title: title.trim(),
      priority,
      ownerId,
      deadline: deadline ? new Date(deadline) : undefined,
      status: "NOVO",
    },
    include: { contact: true, owner: true },
  });

  await recordAudit({
    userId: req.user.sub,
    action: "ticket.created",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: { title: ticket.title, priority: ticket.priority },
  });

  getIO()?.emit("ticket:updated", ticket);
  res.status(201).json(ticket);
}

export async function updateTicket(req, res) {
  const { status, priority, ownerId } = req.body ?? {};
  if (status && !TICKET_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }
  if (priority && !PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: "Prioridade inválida" });
  }

  const ticket = await prisma.ticket.update({
    where: { id: req.params.id },
    data: {
      ...(status && { status, closedAt: status === "FINALIZADO" ? new Date() : null }),
      ...(priority && { priority }),
      ...(ownerId !== undefined && { ownerId }),
    },
    include: { contact: true, owner: true },
  });

  await recordAudit({
    userId: req.user.sub,
    action: "ticket.updated",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: { status, priority, ownerId },
  });

  getIO()?.emit("ticket:updated", ticket);
  res.json(ticket);
}
