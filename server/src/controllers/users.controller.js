import { prisma } from "../config/prisma.js";

export async function listAgents(req, res) {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
  res.json(users);
}
