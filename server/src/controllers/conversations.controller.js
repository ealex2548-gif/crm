import { prisma } from "../config/prisma.js";
import { getIO } from "../websocket/index.js";
import { whatsappProvider } from "../services/whatsapp/index.js";
import { env } from "../config/env.js";
import { PRIORITIES, CONVERSATION_STATUSES, MESSAGE_TYPES } from "../constants/enums.js";
import { recordAudit } from "../services/auditLog.js";
import { computeSla } from "../constants/sla.js";
import { conversationScope, isAgent } from "../services/access.js";
import { getEntrySectorId } from "../services/entrySector.js";

// Conversa que este usuário pode ver (atendente: só as atribuídas a ele).
// Fora do alcance responde 404, como se não existisse.
async function findAccessible(req, include) {
  return prisma.conversation.findFirst({
    where: { AND: [{ id: req.params.id }, await conversationScope(req.user)] },
    ...(include && { include }),
  });
}

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
    where: await conversationScope(req.user),
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

  // Como no WhatsApp: quem mandou/recebeu mensagem por último fica no topo.
  const lastActivity = (c) => (c.messages[0]?.createdAt ?? c.createdAt).getTime();
  withUnread.sort((a, b) => lastActivity(b) - lastActivity(a));

  res.json(withUnread.map(serializeConversation));
}

export async function getConversation(req, res) {
  const conversation = await findAccessible(req, { contact: true, sector: true, assignedAgent: true });
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

  if (!(await findAccessible(req))) return res.status(404).json({ error: "Conversa não encontrada" });

  // Finalizar devolve a conversa para o setor de entrada, sem responsável.
  const finishing = status === "FINALIZADO";
  const entrySectorId = finishing ? await getEntrySectorId() : null;

  const conversation = await prisma.conversation.update({
    where: { id: req.params.id },
    data: {
      ...(priority && { priority }),
      ...(status && { status, closedAt: status === "FINALIZADO" ? new Date() : null }),
      ...(sectorId !== undefined && { sectorId }),
      ...(assignedAgentId !== undefined && { assignedAgentId }),
      ...(finishing && { sectorId: entrySectorId, assignedAgentId: null }),
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
  // Aviso geral (só o id): quem recebeu a conversa por transferência não está na
  // sala dela ainda — cada tela recarrega a lista pela API, que filtra o acesso.
  getIO()?.emit("conversation:updated", { id: conversation.id });
  getIO()?.to(`conversation:${conversation.id}`).emit("conversation:updated", serialized);
  res.json(serialized);
}

// Menu da lista (como no WhatsApp): { read: true } zera as não lidas sem abrir a
// conversa; { read: false } marca a última mensagem do cliente como não lida.
export async function setConversationRead(req, res) {
  const { read } = req.body ?? {};
  if (typeof read !== "boolean") return res.status(400).json({ error: "Informe read (true ou false)" });
  const conversation = await findAccessible(req);
  if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });

  if (read) {
    await prisma.message.updateMany({
      where: { conversationId: conversation.id, direction: "IN", readAt: null },
      data: { readAt: new Date() },
    });
  } else {
    const last = await prisma.message.findFirst({
      where: { conversationId: conversation.id, direction: "IN" },
      orderBy: { createdAt: "desc" },
    });
    if (last) await prisma.message.update({ where: { id: last.id }, data: { readAt: null } });
  }

  getIO()?.emit("conversation:updated", { id: conversation.id });
  res.status(204).end();
}

export async function listMessages(req, res) {
  const conversation = await findAccessible(req);
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

// Conversa sem responsável fica "fechada": dá para ler, mas responder só depois de
// iniciar o atendimento (aceitar). Aceita por outra pessoa, o atendente só lê;
// Admin/Supervisor podem intervir. Nota interna é sempre liberada.
function replyBlockedReason(conversation, user) {
  if (!conversation.assignedAgentId) return "Inicie o atendimento para responder esta conversa";
  if (conversation.assignedAgentId !== user.sub && isAgent(user)) {
    return "Esta conversa está em atendimento por outra pessoa";
  }
  return null;
}

const CONVERSATION_INCLUDE = {
  contact: true,
  sector: true,
  assignedAgent: true,
  messages: { orderBy: { createdAt: "desc" }, take: 1 },
};

// "Iniciar atendimento": fica com a conversa. Se dois clicarem juntos, só o
// primeiro consegue (updateMany só acha a conversa enquanto ninguém a pegou).
export async function acceptConversation(req, res) {
  const conversation = await findAccessible(req, { assignedAgent: true });
  if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });

  if (conversation.assignedAgentId && conversation.assignedAgentId !== req.user.sub) {
    return res.status(409).json({ error: `Esta conversa já foi aceita por ${conversation.assignedAgent?.name ?? "outra pessoa"}` });
  }
  if (!conversation.assignedAgentId) {
    const { count } = await prisma.conversation.updateMany({
      where: { id: conversation.id, assignedAgentId: null },
      data: { assignedAgentId: req.user.sub, status: "EM_ATENDIMENTO", closedAt: null },
    });
    if (count === 0) {
      const taken = await prisma.conversation.findUnique({ where: { id: conversation.id }, include: { assignedAgent: true } });
      return res.status(409).json({ error: `Esta conversa já foi aceita por ${taken?.assignedAgent?.name ?? "outra pessoa"}` });
    }
    await recordAudit({ userId: req.user.sub, action: "conversation.accepted", entityType: "Conversation", entityId: conversation.id });
  }

  const updated = await prisma.conversation.findUnique({ where: { id: conversation.id }, include: CONVERSATION_INCLUDE });
  const serialized = serializeConversation(updated);
  getIO()?.emit("conversation:updated", { id: updated.id });
  getIO()?.to(`conversation:${updated.id}`).emit("conversation:updated", serialized);
  res.json(serialized);
}

export async function createMessage(req, res) {
  const { body, type = "TEXT" } = req.body ?? {};
  if (!body?.trim()) return res.status(400).json({ error: "Mensagem vazia" });
  if (!MESSAGE_TYPES.includes(type)) return res.status(400).json({ error: "Tipo de mensagem inválido" });

  const conversation = await findAccessible(req, { contact: true });
  if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });
  const blocked = type === "TEXT" && replyBlockedReason(conversation, req.user);
  if (blocked) return res.status(409).json({ error: blocked });

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

  const conversation = await findAccessible(req, { contact: true });
  if (!conversation) return res.status(404).json({ error: "Conversa não encontrada" });
  const blocked = replyBlockedReason(conversation, req.user);
  if (blocked) return res.status(409).json({ error: blocked });

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
