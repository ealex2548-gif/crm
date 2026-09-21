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

// Lista todo mundo (inclusive inativo) — para a tela de gestão de
// usuários. GET /api/users continua só com ativos, usado pelos seletores
// de "responsável" nas conversas/tickets.
export async function listAllUsers(req, res) {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, active: true, sector: { select: { name: true } } },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
  res.json(users);
}

// Admin pode ativar/desativar qualquer um (menos a si mesmo, pra não se
// trancar fora). Supervisor só pode mexer em Atendente — não em outro
// Supervisor nem em Admin. É o "poder real" que separa Supervisor de
// Atendente hoje.
export async function setUserActive(req, res) {
  const { active } = req.body ?? {};
  if (typeof active !== "boolean") {
    return res.status(400).json({ error: "Informe active (true ou false)" });
  }

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Usuário não encontrado" });

  if (target.id === req.user.sub) {
    return res.status(400).json({ error: "Você não pode desativar sua própria conta" });
  }
  if (req.user.role === "SUPERVISOR" && target.role !== "AGENT") {
    return res.status(403).json({ error: "Supervisor só pode ativar/desativar atendentes" });
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { active },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  await recordAudit({
    userId: req.user.sub,
    action: active ? "user.activated" : "user.deactivated",
    entityType: "User",
    entityId: user.id,
    metadata: { targetEmail: user.email },
  });

  res.json(user);
}
