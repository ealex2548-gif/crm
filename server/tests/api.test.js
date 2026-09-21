import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync, mkdirSync } from "node:fs";
import path from "node:path";
import request from "supertest";

const TEST_DB = path.resolve(import.meta.dirname, "tmp", "test.db");

// Precisa ser setado antes de qualquer import que toque src/config/env.js
// (ele lê process.env uma única vez, no import).
process.env.DATABASE_URL = `file:${TEST_DB}`;
process.env.JWT_SECRET = "test-secret-not-for-production-aaaaaaaaaaaaaaaaaaaaaa";
process.env.NODE_ENV = "test";
process.env.WHATSAPP_PROVIDER = "mock";

before(() => {
  mkdirSync(path.dirname(TEST_DB), { recursive: true });
  if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(import.meta.dirname, ".."),
    env: process.env,
    stdio: "ignore",
  });
});

const { createApp } = await import("../src/app.js");
const { prisma } = await import("../src/config/prisma.js");
const { hashPassword } = await import("../src/utils/password.js");

after(async () => {
  await prisma.$disconnect();
  if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
});

const app = createApp();

let agentToken;
let adminToken;
let supervisorToken;
let contactId;
let conversationId;
let secondAgentId;

test("health check responde ok", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "ok");
});

test("seed de usuário/setor/contato para os testes seguintes", async () => {
  const sector = await prisma.sector.create({ data: { name: "Suporte" } });
  const passwordHash = await hashPassword("senha123");
  await prisma.user.create({
    data: { name: "Teste Agente", email: "agente@test.com", passwordHash, role: "AGENT", sectorId: sector.id },
  });
  await prisma.user.create({
    data: { name: "Teste Admin", email: "admin@test.com", passwordHash, role: "ADMIN", sectorId: sector.id },
  });
  await prisma.user.create({
    data: { name: "Teste Supervisor", email: "supervisor@test.com", passwordHash, role: "SUPERVISOR", sectorId: sector.id },
  });
  const secondAgent = await prisma.user.create({
    data: { name: "Segundo Agente", email: "agente2@test.com", passwordHash, role: "AGENT", sectorId: sector.id },
  });
  secondAgentId = secondAgent.id;
  const contact = await prisma.contact.create({
    data: { name: "Cliente Teste", phone: "+5511999990000", company: "Empresa Teste", sectorId: sector.id },
  });
  contactId = contact.id;
});

test("login falha com senha errada", async () => {
  const res = await request(app).post("/api/auth/login").send({ email: "agente@test.com", password: "errada" });
  assert.equal(res.status, 401);
});

test("login funciona com credenciais corretas", async () => {
  const res = await request(app).post("/api/auth/login").send({ email: "agente@test.com", password: "senha123" });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  agentToken = res.body.token;
});

test("login do admin de teste", async () => {
  const res = await request(app).post("/api/auth/login").send({ email: "admin@test.com", password: "senha123" });
  assert.equal(res.status, 200);
  adminToken = res.body.token;
});

test("login do supervisor de teste", async () => {
  const res = await request(app).post("/api/auth/login").send({ email: "supervisor@test.com", password: "senha123" });
  assert.equal(res.status, 200);
  supervisorToken = res.body.token;
});

test("rota protegida rejeita sem token", async () => {
  const res = await request(app).get("/api/tickets");
  assert.equal(res.status, 401);
});

test("/api/auth/me retorna o usuário do token", async () => {
  const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${agentToken}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.email, "agente@test.com");
});

test("conversa criada aparece na listagem da API", async () => {
  const conversation = await prisma.conversation.create({
    data: { contactId, priority: "NORMAL", status: "EM_ATENDIMENTO" },
  });
  conversationId = conversation.id;

  const res = await request(app).get("/api/conversations").set("Authorization", `Bearer ${agentToken}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.some((c) => c.id === conversationId));
});

test("enviar mensagem passa pelo provedor mock de whatsapp e persiste", async () => {
  const res = await request(app)
    .post(`/api/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ body: "Mensagem de teste" });
  assert.equal(res.status, 201);
  assert.equal(res.body.body, "Mensagem de teste");
  assert.equal(res.body.direction, "OUT");
  assert.ok(res.body.whatsappMessageId.startsWith("mock_"));
});

test("mensagem com tipo inválido é rejeitada", async () => {
  const res = await request(app)
    .post(`/api/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ body: "x", type: "BOGUS" });
  assert.equal(res.status, 400);
});

test("mensagem vazia é rejeitada", async () => {
  const res = await request(app)
    .post(`/api/conversations/${conversationId}/messages`)
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ body: "   " });
  assert.equal(res.status, 400);
});

test("atualizar prioridade da conversa", async () => {
  const res = await request(app)
    .patch(`/api/conversations/${conversationId}`)
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ priority: "URGENTE" });
  assert.equal(res.status, 200);
  assert.equal(res.body.priority, "URGENTE");
});

test("criar ticket e rejeitar prioridade inválida", async () => {
  const ok = await request(app)
    .post("/api/tickets")
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ contactId, title: "Ticket de teste", priority: "ALTA" });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.status, "NOVO");

  const bad = await request(app)
    .post("/api/tickets")
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ contactId, title: "x", priority: "SUPER_URGENTE" });
  assert.equal(bad.status, 400);
});

test("atualizar status do ticket", async () => {
  const created = await request(app)
    .post("/api/tickets")
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ contactId, title: "Outro ticket", priority: "NORMAL" });

  const patched = await request(app)
    .patch(`/api/tickets/${created.body.id}`)
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ status: "EM_ATENDIMENTO" });
  assert.equal(patched.status, 200);
  assert.equal(patched.body.status, "EM_ATENDIMENTO");
});

test("lista de usuários (agentes) exige autenticação e retorna o agente seedado", async () => {
  const unauthed = await request(app).get("/api/users");
  assert.equal(unauthed.status, 401);

  const res = await request(app).get("/api/users").set("Authorization", `Bearer ${agentToken}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.some((u) => u.name === "Teste Agente"));
});

test("upload de mídia cria mensagem do tipo MEDIA com mediaUrl servível", async () => {
  const res = await request(app)
    .post(`/api/conversations/${conversationId}/media`)
    .set("Authorization", `Bearer ${agentToken}`)
    .attach("file", Buffer.from("fake-image-bytes"), { filename: "foto.png", contentType: "image/png" });

  assert.equal(res.status, 201);
  assert.equal(res.body.type, "MEDIA");
  assert.match(res.body.mediaUrl, /^\/uploads\/.+\.png$/);
  assert.equal(res.body.body, "foto.png");

  const served = await request(app).get(res.body.mediaUrl);
  assert.equal(served.status, 200);
});

test("upload rejeita tipo de arquivo não permitido", async () => {
  const res = await request(app)
    .post(`/api/conversations/${conversationId}/media`)
    .set("Authorization", `Bearer ${agentToken}`)
    .attach("file", Buffer.from("conteudo"), { filename: "virus.exe", contentType: "application/x-msdownload" });

  assert.equal(res.status, 400);
});

test("agente comum não pode criar usuário (403)", async () => {
  const res = await request(app)
    .post("/api/users")
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ name: "Novo Agente", email: "novo@test.com", password: "senha123" });
  assert.equal(res.status, 403);
});

test("admin pode criar usuário, e-mail duplicado é rejeitado", async () => {
  const ok = await request(app)
    .post("/api/users")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Novo Agente", email: "novo@test.com", password: "senha123" });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.role, "AGENT");

  const dup = await request(app)
    .post("/api/users")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ name: "Duplicado", email: "novo@test.com", password: "senha123" });
  assert.equal(dup.status, 409);
});

test("agente comum não pode ver logs de auditoria (403), admin pode", async () => {
  const forbidden = await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${agentToken}`);
  assert.equal(forbidden.status, 403);

  const res = await request(app).get("/api/audit-logs").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 200);
  assert.ok(res.body.some((l) => l.action === "login.success"));
  assert.ok(res.body.some((l) => l.action === "ticket.created"));
  assert.ok(res.body.some((l) => l.action === "user.created"));
});

test("agente comum não acessa a lista completa de usuários (403)", async () => {
  const res = await request(app).get("/api/users/all").set("Authorization", `Bearer ${agentToken}`);
  assert.equal(res.status, 403);
});

test("admin e supervisor acessam a lista completa de usuários", async () => {
  const asAdmin = await request(app).get("/api/users/all").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(asAdmin.status, 200);
  assert.ok(asAdmin.body.length >= 5);

  const asSupervisor = await request(app).get("/api/users/all").set("Authorization", `Bearer ${supervisorToken}`);
  assert.equal(asSupervisor.status, 200);
});

test("supervisor não pode desativar admin nem outro supervisor (403)", async () => {
  const adminMe = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${adminToken}`);
  const res = await request(app)
    .patch(`/api/users/${adminMe.body.id}/active`)
    .set("Authorization", `Bearer ${supervisorToken}`)
    .send({ active: false });
  assert.equal(res.status, 403);
});

test("supervisor pode desativar um atendente, e o atendente perde o login", async () => {
  const res = await request(app)
    .patch(`/api/users/${secondAgentId}/active`)
    .set("Authorization", `Bearer ${supervisorToken}`)
    .send({ active: false });
  assert.equal(res.status, 200);
  assert.equal(res.body.active, false);

  const loginAttempt = await request(app)
    .post("/api/auth/login")
    .send({ email: "agente2@test.com", password: "senha123" });
  assert.equal(loginAttempt.status, 401);

  // reativa pra não deixar lixo pros próximos testes
  const reactivate = await request(app)
    .patch(`/api/users/${secondAgentId}/active`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ active: true });
  assert.equal(reactivate.status, 200);
});

test("ninguém pode desativar a própria conta", async () => {
  const adminMe = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${adminToken}`);
  const res = await request(app)
    .patch(`/api/users/${adminMe.body.id}/active`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ active: false });
  assert.equal(res.status, 400);
});

test("agente comum não pode ativar/desativar ninguém (403)", async () => {
  const res = await request(app)
    .patch(`/api/users/${secondAgentId}/active`)
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ active: false });
  assert.equal(res.status, 403);
});

test("trocar a própria senha exige a senha atual correta", async () => {
  const wrong = await request(app)
    .patch("/api/auth/me/password")
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ currentPassword: "senhaErrada", newPassword: "novaSenha123" });
  assert.equal(wrong.status, 401);

  const ok = await request(app)
    .patch("/api/auth/me/password")
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ currentPassword: "senha123", newPassword: "novaSenha123" });
  assert.equal(ok.status, 200);

  const loginOld = await request(app).post("/api/auth/login").send({ email: "agente@test.com", password: "senha123" });
  assert.equal(loginOld.status, 401);

  const loginNew = await request(app).post("/api/auth/login").send({ email: "agente@test.com", password: "novaSenha123" });
  assert.equal(loginNew.status, 200);
});
