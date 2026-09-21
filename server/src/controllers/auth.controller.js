import { prisma } from "../config/prisma.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";
import { recordAudit } from "../services/auditLog.js";

export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    await recordAudit({ action: "login.failed", entityType: "User", metadata: { email } });
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    await recordAudit({ userId: user.id, action: "login.failed", entityType: "User", entityId: user.id });
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  await recordAudit({ userId: user.id, action: "login.success", entityType: "User", entityId: user.id });

  const token = signToken({ sub: user.id, role: user.role, name: user.name });
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }
  return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
}

export async function changeMyPassword(req, res) {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Informe a senha atual e a nova senha" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "A nova senha precisa ter ao menos 6 caracteres" });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Senha atual incorreta" });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await recordAudit({ userId: user.id, action: "user.password_changed", entityType: "User", entityId: user.id });

  res.json({ success: true });
}
