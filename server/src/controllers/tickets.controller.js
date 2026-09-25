import { prisma } from "../config/prisma.js";
import { getIO } from "../websocket/index.js";
import { PRIORITIES, TICKET_STATUSES } from "../constants/enums.js";
import { recordAudit } from "../services/auditLog.js";
import { ticketScope, canAccessConversation, isAgent } from "../services/access.js";

export async function listTickets(req, res) {
  // ?conversationId=... → só os tickets daquela conversa (botão do Atendimento).
  const { conversationId } = req.query;
  const tickets = await prisma.ticket.findMany({
    where: { AND: [conversationId ? { conversationId: String(conversationId) } : {}, await ticketScope(req.user)] },
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
  // Atendente só abre ticket de conversa que ele pode ver; sem dono informado,
  // o ticket fica no nome dele (senão ele mesmo deixaria de enxergá-lo).
  if (isAgent(req.user) && conversationId && !(await canAccessConversation(req.user, conversationId))) {
    return res.status(404).json({ error: "Conversa não encontrada" });
  }
  const owner = ownerId ?? (isAgent(req.user) ? req.user.sub : undefined);

  const ticket = await prisma.ticket.create({
    data: {
      contactId,
      conversationId,
      title: title.trim(),
      priority,
      ownerId: owner,
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

  getIO()?.emit("ticket:updated", { id: ticket.id });
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

  const visible = await prisma.ticket.findFirst({
    where: { AND: [{ id: req.params.id }, await ticketScope(req.user)] },
    select: { id: true },
  });
  if (!visible) return res.status(404).json({ error: "Ticket não encontrado" });

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

  getIO()?.emit("ticket:updated", { id: ticket.id });
  res.json(ticket);
}
