import { prisma } from "../config/prisma.js";

export async function listAuditLogs(req, res) {
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  res.json(
    logs.map((l) => ({
      id: l.id,
      user: l.user,
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      metadata: l.metadata ? JSON.parse(l.metadata) : null,
      createdAt: l.createdAt,
    }))
  );
}
