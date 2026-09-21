import { prisma } from "../config/prisma.js";
import { hashPassword } from "../utils/password.js";
import { recordAudit } from "../services/auditLog.js";
import { ROLES } from "../constants/enums.js";

export async function listAgents(req, res) {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
  res.json(users);
}

// Só ADMIN pode criar usuário (ver requireRole na rota) — é o ponto
// concreto onde "nem todo mundo é admin" passa a valer de verdade.
export async function createUser(req, res) {
  const { name, email, password, role = "AGENT", sectorId } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: "Informe nome, e-mail e senha" });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: "Papel inválido" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Senha precisa ter ao menos 6 caracteres" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "Já existe um usuário com esse e-mail" });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name: name.trim(), email: email.trim(), passwordHash, role, sectorId },
    select: { id: true, name: true, email: true, role: true },
  });

  await recordAudit({
    userId: req.user.sub,
    action: "user.created",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role },
  });

  res.status(201).json(user);
}
