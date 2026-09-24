import crypto from "node:crypto";
import { prisma } from "../config/prisma.js";
import { getIO } from "../websocket/index.js";
import { env } from "../config/env.js";
import { whatsappProvider } from "../services/whatsapp/index.js";
import { phoneKey, formatWaId } from "../utils/phone.js";

// Eventos que hoje só reconhecemos e confirmamos (200 OK), sem processar —
// coexistência (histórico/contatos do celular) e status de conta ficam
// para uma fase futura da integração.
const IGNORED_EVENTS = ["history", "smb_app_state_sync", "account_update"];

function isValidSignature(req) {
  const secret = env.whatsapp.covercut.webhookSecret;
  if (!secret) return false;
  const signature = req.get("x-bsp-signature");
  if (!signature || !req.rawBody) return false;

  const expected = crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function receiveCoverCutWebhook(req, res) {
  if (!isValidSignature(req)) {
    return res.status(401).json({ error: "Assinatura inválida" });
  }

  // Responde rápido — a CoverCut recomenda 200 imediato para não sofrer timeout.
  // A partir daqui a resposta já foi enviada, então qualquer erro só é logado
  // (não pode mais virar um response — por isso o try/catch local, sem
  // repassar pro errorHandler global).
  res.status(200).json({ received: true });

  try {
    const event = req.body?.event;
    if (IGNORED_EVENTS.includes(event)) return;

    if (event === "status") {
      const update = whatsappProvider.parseStatusPayload?.(req.body);
      if (update) await recordStatusUpdate(update);
      return;
    }

    const entries = whatsappProvider.parseWebhookPayload(req.body);
    for (const entry of entries) {
      if (!entry.from) continue;
      await recordMessage(entry);
    }
  } catch (err) {
    console.error("[webhook:covercut] falha ao processar mensagem recebida:", err);
  }
}

// O CRM guarda "+55 92 99999-9999" e o wa_id chega como "559299999999"
// (às vezes sem o nono dígito) — compara pela chave normalizada.
async function findOrCreateContact(waId, name) {
  const key = phoneKey(waId);
  const contacts = await prisma.contact.findMany({ select: { id: true, phone: true, name: true } });
  const existing = contacts.find((c) => phoneKey(c.phone) === key);

  if (existing) {
    // Só troca o nome se o contato ainda estiver com o número como nome.
    if (name && existing.name === existing.phone) {
      return prisma.contact.update({ where: { id: existing.id }, data: { name } });
    }
    return existing;
  }

  const phone = formatWaId(waId);
  return prisma.contact.create({ data: { phone, name: name ?? phone } });
}

// Mensagem do cliente (IN) ou resposta digitada no celular da empresa (OUT, via echo).
async function recordMessage(entry) {
  // A CoverCut reenvia o webhook se não receber 200 a tempo — não duplica.
  const duplicate = await prisma.message.findFirst({
    where: { whatsappMessageId: entry.whatsappMessageId },
    select: { id: true },
  });
  if (duplicate) return;

  const contact = await findOrCreateContact(entry.from, entry.name);

  let conversation = await prisma.conversation.findFirst({
    where: { contactId: contact.id, status: { not: "FINALIZADO" } },
    orderBy: { createdAt: "desc" },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { contactId: contact.id, priority: "NORMAL", status: "EM_ATENDIMENTO" },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      direction: entry.direction ?? "IN",
      type: entry.type ?? "TEXT",
      body: entry.text,
      whatsappMessageId: entry.whatsappMessageId,
      status: entry.direction === "OUT" ? "SENT" : "DELIVERED",
    },
  });

  getIO()?.emit("conversation:updated", { id: conversation.id });
  getIO()?.to(`conversation:${conversation.id}`).emit("message:new", message);
}

// Status chegam fora de ordem (read antes de delivered, por exemplo) — nunca
// rebaixa um status já mais avançado.
const STATUS_RANK = { PENDING: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4 };

async function recordStatusUpdate({ whatsappMessageId, status }) {
  const message = await prisma.message.findFirst({
    where: { whatsappMessageId, direction: "OUT" },
  });
  if (!message || STATUS_RANK[status] <= STATUS_RANK[message.status]) return;

  const updated = await prisma.message.update({ where: { id: message.id }, data: { status } });
  getIO()?.to(`conversation:${message.conversationId}`).emit("message:updated", updated);
}
