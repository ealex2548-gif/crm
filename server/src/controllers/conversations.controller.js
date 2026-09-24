import { prisma } from "../config/prisma.js";
import { getIO } from "../websocket/index.js";
import { whatsappProvider } from "../services/whatsapp/index.js";
import { env } from "../config/env.js";
import { PRIORITIES, CONVERSATION_STATUSES, MESSAGE_TYPES } from "../constants/enums.js";
import { recordAudit } from "../services/auditLog.js";
import { computeSla } from "../constants/sla.js";

function serializeConversation(conversation) {
  const lastMessage = conversation.messages?.[0];
  return {
    id: conversation.id,
    priority: conversation.priority,
    status: conversation.status,
    sector: conversation.sector,
    assignedAgent: conversation.assignedAgent
      ? { id: conversation.assignedAgent.id, name: conversation.assignedAgent.name }
      : null,
    contact: conversation.contact,
    lastMessage: lastMessage
      ? { body: lastMessage.body, type: lastMessage.type, createdAt: lastMessage.createdAt }
      : null,
    unreadCount: conversation.unreadCount ?? 0,
    sla: computeSla(conversation.priority, lastMessage),
    createdAt: conversation.createdAt,
  };
}

export async function listConversations(req, res) {
  const conversations = await prisma.conversation.findMany({
    include: {
      contact: true,
      sector: true,
      assignedAgent: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  const withUnread = await Promise.all(
    conversations.map(async (c) => ({
      ...c,
      unreadCount: await prisma.message.count({
        where: { conversationId: c.id, direction: "IN", readAt: null },
      }),
    }))
  );

  res.json(withUnread.map(serializeConversation));
}

export async function getConversation(req, res) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: { contact: true, sector: true, assignedAgent: true },
  });
  if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });
  res.json(conversation);
}

export async function updateConversation(req, res) {
  const { priority, status, sectorId, assignedAgentId } = req.body ?? {};
  if (priority && !PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: "Prioridade inválida" });
  }
  if (status && !CONVERSATION_STATUSES.includes(status)) {
    return res.status(400).json({ error: "Status inválido" });
  }

  const conversation = await prisma.conversation.update({
    where: { id: req.params.id },
    data: {
      ...(priority && { priority }),
      ...(status && { status, closedAt: status === "FINALIZADO" ? new Date() : null }),
      ...(sectorId !== undefined && { sectorId }),
      ...(assignedAgentId !== undefined && { assignedAgentId }),
    },
    include: {
      contact: true,
      sector: true,
      assignedAgent: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  await recordAudit({
    userId: req.user.sub,
    action: "conversation.updated",
    entityType: "Conversation",
    entityId: conversation.id,
    metadata: { priority, status, sectorId, assignedAgentId },
  });

  const serialized = serializeConversation(conversation);
  getIO()?.to(`conversation:${conversation.id}`).emit("conversation:updated", serialized);
  res.json(serialized);
}

export async function listMessages(req, res) {
  const conversation = await prisma.conversation.findUnique({ where: { id: req.params.id } });
  if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });

  const messages = await prisma.message.findMany({
    where: { conversationId: req.params.id },
    orderBy: { createdAt: "asc" },
  });

  // Abrir a conversa marca as mensagens do cliente como lidas.
  const { count } = await prisma.message.updateMany({
    where: { conversationId: req.params.id, direction: "IN", readAt: null },
    data: { readAt: new Date() },
  });
  if (count > 0) getIO()?.emit("conversation:updated", { id: conversation.id });

  res.json(messages);
}

export async function createMessage(req, res) {
  const { body, type = "TEXT" } = req.body ?? {};
  if (!body?.trim()) return res.status(400).json({ error: "Mensagem vazia" });
  if (!MESSAGE_TYPES.includes(type)) return res.status(400).json({ error: "Tipo de mensagem inválido" });

  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: { contact: true },
  });
  if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });

  let whatsappMessageId;
  if (type === "TEXT") {
    const sent = await whatsappProvider.sendTextMessage(conversation.contact.phone, body.trim());
    whatsappMessageId = sent.id;
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "OUT",
      type,
      body: body.trim(),
      whatsappMessageId,
      sentById: req.user.sub,
      status: "SENT",
    },
  });

  getIO()?.to(`conversation:${conversation.id}`).emit("message:new", message);
  res.status(201).json(message);
}

export async function uploadMedia(req, res) {
  if (!req.file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

  const conversation = await prisma.conversation.findUnique({
    where: { id: req.params.id },
    include: { contact: true },
  });
  if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });

  const mediaUrl = `/uploads/${req.file.filename}`;
  const sent = await whatsappProvider.sendMediaMessage(
    conversation.contact.phone,
    `${env.publicBaseUrl}${mediaUrl}`,
    { mimetype: req.file.mimetype, filename: req.file.originalname, filePath: req.file.path }
  );

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: "OUT",
      type: "MEDIA",
      body: req.file.originalname,
      mediaUrl,
      whatsappMessageId: sent.id,
      sentById: req.user.sub,
      status: "SENT",
    },
  });

  getIO()?.to(`conversation:${conversation.id}`).emit("message:new", message);
  res.status(201).json(message);
}
