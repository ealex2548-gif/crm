import { prisma } from "../config/prisma.js";

export async function getReportsSummary(req, res) {
  const tickets = await prisma.ticket.findMany({
    include: { owner: { select: { name: true } }, contact: { select: { name: true, company: true } } },
  });

  const byAgent = {};
  for (const t of tickets) {
    const name = t.owner?.name ?? "Sem responsável";
    byAgent[name] = (byAgent[name] ?? 0) + 1;
  }

  const resolved = tickets.filter((t) => t.status === "FINALIZADO" && t.closedAt);
  const avgResolutionMinutes = resolved.length
    ? Math.round(
        resolved.reduce((sum, t) => sum + (t.closedAt - t.createdAt) / 60000, 0) / resolved.length
      )
    : null;

  const byClient = {};
  for (const t of tickets) {
    const name = t.contact?.company || t.contact?.name || "Desconhecido";
    byClient[name] = (byClient[name] ?? 0) + 1;
  }
  const topClients = Object.entries(byClient)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  res.json({
    attendancesByAgent: Object.entries(byAgent)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => b.count - a.count),
    avgResolutionMinutes,
    topClients,
  });
}
