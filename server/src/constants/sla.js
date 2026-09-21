// Meta de primeira resposta por prioridade (minutos). Escopo do SLA aqui é
// "tempo até o agente responder a última mensagem do cliente" — o tipo
// mais comum de SLA de chat de suporte. SLA de resolução (ticket fechado
// dentro do prazo) é uma métrica diferente, não coberta por este arquivo.
export const SLA_MINUTES_BY_PRIORITY = {
  URGENTE: 15,
  ALTA: 30,
  NORMAL: 120,
  BAIXA: 480,
};

/**
 * @param {string} priority
 * @param {{direction: string, createdAt: Date|string}|null} lastMessage
 */
export function computeSla(priority, lastMessage) {
  // Sem mensagem, ou o agente já respondeu por último: relógio não corre.
  if (!lastMessage || lastMessage.direction !== "IN") {
    return { status: "ok", deadline: null, minutesRemaining: null };
  }

  const minutes = SLA_MINUTES_BY_PRIORITY[priority] ?? SLA_MINUTES_BY_PRIORITY.NORMAL;
  const deadline = new Date(new Date(lastMessage.createdAt).getTime() + minutes * 60000);
  const minutesRemaining = Math.round((deadline.getTime() - Date.now()) / 60000);

  return {
    status: minutesRemaining < 0 ? "breached" : "running",
    deadline: deadline.toISOString(),
    minutesRemaining,
  };
}
