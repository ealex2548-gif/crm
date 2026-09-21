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
let contactId;
let conversationId;

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
