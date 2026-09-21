import { prisma } from "../config/prisma.js";

/**
 * Registra uma ação sensível (login, criação/alteração de ticket ou
 * conversa, gestão de usuários) para auditoria. Nunca deve derrubar a
 * requisição que a originou — por isso engole erros e só loga.
 */
export async function recordAudit({ userId, action, entityType, entityId, metadata }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        entityType,
        entityId: entityId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (err) {
    console.error("[audit] falha ao registrar log:", err);
  }
}
