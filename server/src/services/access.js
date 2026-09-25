import { prisma } from "../config/prisma.js";

// Quem vê o quê. O número da empresa também recebe conversas pessoais do dono,
// então atendente (AGENT) só enxerga conversas atribuídas a ele OU do setor dele
// (vários atendentes do Suporte veem as do Suporte). Conversas novas chegam sem
// responsável e sem setor — ficam só com Admin/Supervisor, que encaminham.

export function isAgent(user) {
  return user?.role === "AGENT";
}

// Setor lido do banco a cada chamada (não do token): se o admin trocar o setor
// do atendente, vale na hora.
async function agentSectorId(user) {
  const row = await prisma.user.findUnique({ where: { id: user.sub }, select: { sectorId: true } });
  return row?.sectorId ?? null;
}

// Filtro Prisma para Conversation.
export async function conversationScope(user) {
  if (!isAgent(user)) return {};
  const sectorId = await agentSectorId(user);
  return sectorId
    ? { OR: [{ assignedAgentId: user.sub }, { sectorId }] }
    : { assignedAgentId: user.sub };
}

// Filtro Prisma para Ticket: dono do ticket ou conversa que ele pode ver.
export async function ticketScope(user) {
  if (!isAgent(user)) return {};
  return { OR: [{ ownerId: user.sub }, { conversation: await conversationScope(user) }] };
}

// Usado pelo WebSocket antes de entrar na sala de uma conversa.
export async function canAccessConversation(user, conversationId) {
  const found = await prisma.conversation.findFirst({
    where: { AND: [{ id: conversationId }, await conversationScope(user)] },
    select: { id: true },
  });
  return Boolean(found);
}
