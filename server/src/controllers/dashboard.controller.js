import { prisma } from "../config/prisma.js";
import { computeSla, SLA_MINUTES_BY_PRIORITY } from "../constants/sla.js";

export async function getDashboardSummary(req, res) {
  const openConversations = await prisma.conversation.findMany({
    where: { status: { not: "FINALIZADO" } },
    include: {
      sector: true,
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  let breachedSla = 0;
  const bySector = {};
  for (const c of openConversations) {
    const sla = computeSla(c.priority, c.messages[0]);
    if (sla.status === "breached") breachedSla++;
    const sectorName = c.sector?.name ?? "Sem setor";
    bySector[sectorName] = (bySector[sectorName] ?? 0) + 1;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [resolvedToday, openTickets] = await Promise.all([
    prisma.ticket.count({ where: { status: "FINALIZADO", closedAt: { gte: todayStart } } }),
    prisma.ticket.count({ where: { status: { not: "FINALIZADO" } } }),
  ]);

  // Tempo médio de 1ª resposta: primeira mensagem IN até a primeira OUT
  // depois dela, nas conversas mais recentes.
  const recentConversations = await prisma.conversation.findMany({
    select: {
      messages: { orderBy: { createdAt: "asc" }, select: { direction: true, createdAt: true } },
    },
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  const firstResponseMinutes = [];
  for (const c of recentConversations) {
    const firstIn = c.messages.find((m) => m.direction === "IN");
    if (!firstIn) continue;
    const firstOutAfter = c.messages.find((m) => m.direction === "OUT" && m.createdAt > firstIn.createdAt);
    if (!firstOutAfter) continue;
    firstResponseMinutes.push((firstOutAfter.createdAt - firstIn.createdAt) / 60000);
  }
  const avgFirstResponseMinutes = firstResponseMinutes.length
    ? Math.round(firstResponseMinutes.reduce((a, b) => a + b, 0) / firstResponseMinutes.length)
    : null;

  res.json({
    openConversations: openConversations.length,
    breachedSla,
    openTickets,
    resolvedToday,
    avgFirstResponseMinutes,
    queueBySector: Object.entries(bySector).map(([sector, count]) => ({ sector, count })),
    slaPolicy: SLA_MINUTES_BY_PRIORITY,
  });
}
