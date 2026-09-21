import { prisma } from "../config/prisma.js";
import { comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Informe e-mail e senha" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

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
