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
  // No setor do atendente de teste — atendente só vê conversas do setor dele ou atribuídas a ele.
  const sector = await prisma.sector.findFirst({ where: { name: "Suporte" } });
  const conversation = await prisma.conversation.create({
    data: { contactId, priority: "NORMAL", status: "EM_ATENDIMENTO", sectorId: sector.id },
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

test("SLA: última mensagem do cliente conta o prazo, resposta do agente zera", async () => {
  agentToken = (
    await request(app).post("/api/auth/login").send({ email: "agente@test.com", password: "novaSenha123" })
  ).body.token;

  const sector = await prisma.sector.findFirst({ where: { name: "Suporte" } });
  const conv = await prisma.conversation.create({
    data: { contactId, priority: "URGENTE", status: "EM_ATENDIMENTO", sectorId: sector.id },
  });

  // 20 min atrás — já estoura o SLA de urgente (15 min)
  await prisma.message.create({
    data: {
      conversationId: conv.id,
      direction: "IN",
      type: "TEXT",
      body: "Preciso de ajuda urgente",
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    },
  });

  const beforeReply = await request(app).get("/api/conversations").set("Authorization", `Bearer ${agentToken}`);
  const convBefore = beforeReply.body.find((c) => c.id === conv.id);
  assert.equal(convBefore.sla.status, "breached");
  assert.ok(convBefore.sla.minutesRemaining < 0);

  await request(app)
    .post(`/api/conversations/${conv.id}/messages`)
    .set("Authorization", `Bearer ${agentToken}`)
    .send({ body: "Já estou verificando" });

  const afterReply = await request(app).get("/api/conversations").set("Authorization", `Bearer ${agentToken}`);
  const convAfter = afterReply.body.find((c) => c.id === conv.id);
  assert.equal(convAfter.sla.status, "ok");
});

test("dashboard e relatórios: agente comum é bloqueado (403), admin recebe dados reais", async () => {
  const forbiddenDash = await request(app).get("/api/dashboard/summary").set("Authorization", `Bearer ${agentToken}`);
  assert.equal(forbiddenDash.status, 403);
  const forbiddenRep = await request(app).get("/api/reports/summary").set("Authorization", `Bearer ${agentToken}`);
  assert.equal(forbiddenRep.status, 403);

  const dash = await request(app).get("/api/dashboard/summary").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(dash.status, 200);
  assert.ok(dash.body.openConversations >= 0);
  assert.ok(Array.isArray(dash.body.queueBySector));
  assert.deepEqual(dash.body.slaPolicy, { URGENTE: 15, ALTA: 30, NORMAL: 120, BAIXA: 480 });

  const rep = await request(app).get("/api/reports/summary").set("Authorization", `Bearer ${adminToken}`);
  assert.equal(rep.status, 200);
  assert.ok(Array.isArray(rep.body.attendancesByAgent));
  assert.ok(Array.isArray(rep.body.topClients));
});

test("respostas rápidas: todos leem, só supervisor/admin cadastram, editam e apagam", async () => {
  const auth = (t) => ({ Authorization: `Bearer ${t}` });

  const forbidden = await request(app).post("/api/quick-replies").set(auth(agentToken)).send({ category: "PDV", body: "Oi" });
  assert.equal(forbidden.status, 403);

  const invalid = await request(app).post("/api/quick-replies").set(auth(supervisorToken)).send({ category: "PDV", body: "  " });
  assert.equal(invalid.status, 400);

  const created = await request(app).post("/api/quick-replies").set(auth(supervisorToken)).send({ category: "PDV", body: "Vou verificar" });
  assert.equal(created.status, 201);

  const list = await request(app).get("/api/quick-replies").set(auth(agentToken));
  assert.ok(list.body.some((r) => r.id === created.body.id));

  const updated = await request(app).put(`/api/quick-replies/${created.body.id}`).set(auth(adminToken)).send({ category: "Fiscal", body: "Texto novo" });
  assert.equal(updated.body.category, "Fiscal");

  assert.equal((await request(app).delete(`/api/quick-replies/${created.body.id}`).set(auth(adminToken))).status, 204);
  assert.equal((await request(app).delete(`/api/quick-replies/${created.body.id}`).set(auth(adminToken))).status, 404);
});

test("base de conhecimento: agente só lê, supervisor cadastra/edita/apaga", async () => {
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const article = { category: "PDV", title: "Serviço parado", body: "Reiniciar o serviço." };

  assert.equal((await request(app).post("/api/knowledge-articles").set(auth(agentToken)).send(article)).status, 403);

  const created = await request(app).post("/api/knowledge-articles").set(auth(supervisorToken)).send(article);
  assert.equal(created.status, 201);

  const updated = await request(app).put(`/api/knowledge-articles/${created.body.id}`).set(auth(supervisorToken)).send({ ...article, title: "Serviço do PDV parado" });
  assert.equal(updated.body.title, "Serviço do PDV parado");

  assert.equal((await request(app).delete(`/api/knowledge-articles/${created.body.id}`).set(auth(supervisorToken))).status, 204);
});

test("tickets podem ser filtrados pela conversa", async () => {
  const auth = { Authorization: `Bearer ${agentToken}` };
  const conversations = await request(app).get("/api/conversations").set(auth);
  const [conv] = conversations.body;
  await request(app).post("/api/tickets").set(auth).send({ contactId: conv.contact.id, conversationId: conv.id, title: "Ticket da conversa" });

  const filtered = await request(app).get(`/api/tickets?conversationId=${conv.id}`).set(auth);
  assert.equal(filtered.status, 200);
  assert.ok(filtered.body.length >= 1);
  assert.ok(filtered.body.every((t) => t.conversationId === conv.id));

  const none = await request(app).get("/api/tickets?conversationId=nao-existe").set(auth);
  assert.deepEqual(none.body, []);
});

test("visibilidade: atendente vê só as conversas atribuídas a ele ou do setor dele", async () => {
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const agent = await prisma.user.findUnique({ where: { email: "agente@test.com" } });
  const outroSetor = await prisma.sector.create({ data: { name: "Financeiro Teste" } });
  const pessoal = await prisma.contact.create({ data: { name: "Mãe", phone: "+5592900000001" } });

  // Sem setor e sem responsável (ex.: conversa pessoal do dono) — só admin/supervisor.
  const semDono = await prisma.conversation.create({ data: { contactId: pessoal.id, status: "EM_ATENDIMENTO" } });
  // De outro setor — atendente do Suporte não vê.
  const deOutroSetor = await prisma.conversation.create({ data: { contactId: pessoal.id, status: "EM_ATENDIMENTO", sectorId: outroSetor.id } });
  // De outro setor mas atribuída a ele — vê.
  const atribuida = await prisma.conversation.create({ data: { contactId: pessoal.id, status: "EM_ATENDIMENTO", sectorId: outroSetor.id, assignedAgentId: agent.id } });

  const lista = (await request(app).get("/api/conversations").set(auth(agentToken))).body.map((c) => c.id);
  assert.ok(!lista.includes(semDono.id), "conversa sem setor/responsável não pode aparecer para atendente");
  assert.ok(!lista.includes(deOutroSetor.id), "conversa de outro setor não pode aparecer");
  assert.ok(lista.includes(atribuida.id), "conversa atribuída a ele deve aparecer");
  assert.ok(lista.includes(conversationId), "conversa do setor dele deve aparecer");

  // Nem por outro caminho: abrir, ler mensagens, enviar, mudar ou abrir ticket.
  for (const id of [semDono.id, deOutroSetor.id]) {
    assert.equal((await request(app).get(`/api/conversations/${id}`).set(auth(agentToken))).status, 404);
    assert.equal((await request(app).get(`/api/conversations/${id}/messages`).set(auth(agentToken))).status, 404);
    assert.equal((await request(app).post(`/api/conversations/${id}/messages`).set(auth(agentToken)).send({ body: "oi" })).status, 404);
    assert.equal((await request(app).patch(`/api/conversations/${id}`).set(auth(agentToken)).send({ assignedAgentId: agent.id })).status, 404);
    assert.equal((await request(app).post("/api/tickets").set(auth(agentToken)).send({ contactId: pessoal.id, conversationId: id, title: "x" })).status, 404);
  }

  // Admin vê tudo.
  const listaAdmin = (await request(app).get("/api/conversations").set(auth(adminToken))).body.map((c) => c.id);
  assert.ok([semDono.id, deOutroSetor.id, atribuida.id].every((id) => listaAdmin.includes(id)));

  // Admin muda o setor do atendente para "Financeiro Teste": passa a ver a de lá, e deixa de ver a do Suporte.
  const mudou = await request(app).patch(`/api/users/${agent.id}/sector`).set(auth(adminToken)).send({ sectorId: outroSetor.id });
  assert.equal(mudou.status, 200);
  const depois = (await request(app).get("/api/conversations").set(auth(agentToken))).body.map((c) => c.id);
  assert.ok(depois.includes(deOutroSetor.id));
  assert.ok(!depois.includes(conversationId));

  // Atendente não muda setor de ninguém.
  assert.equal((await request(app).patch(`/api/users/${agent.id}/sector`).set(auth(agentToken)).send({ sectorId: null })).status, 403);

  // Volta o setor original para não afetar outros testes.
  const suporte = await prisma.sector.findFirst({ where: { name: "Suporte" } });
  await prisma.user.update({ where: { id: agent.id }, data: { sectorId: suporte.id } });
});

test("fluxo Geral: finalizar devolve a conversa ao Geral, sem responsável, e o atendente deixa de ver", async () => {
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const agent = await prisma.user.findUnique({ where: { email: "agente@test.com" } });
  const suporte = await prisma.sector.findFirst({ where: { name: "Suporte" } });
  const cliente = await prisma.contact.create({ data: { name: "Cliente Fluxo", phone: "+5592900000077" } });

  // Você distribuiu para o Suporte / atendente.
  const conv = await prisma.conversation.create({
    data: { contactId: cliente.id, status: "EM_ATENDIMENTO", sectorId: suporte.id, assignedAgentId: agent.id },
  });
  const antes = (await request(app).get("/api/conversations").set(auth(agentToken))).body.map((c) => c.id);
  assert.ok(antes.includes(conv.id));

  // Atendente finaliza.
  const fin = await request(app).patch(`/api/conversations/${conv.id}`).set(auth(agentToken)).send({ status: "FINALIZADO" });
  assert.equal(fin.status, 200);
  assert.equal(fin.body.sector.name, "Geral");
  assert.equal(fin.body.assignedAgent, null);

  const depois = (await request(app).get("/api/conversations").set(auth(agentToken))).body.map((c) => c.id);
  assert.ok(!depois.includes(conv.id), "finalizada volta para o Geral e sai do atendente");

  const admin = (await request(app).get("/api/conversations").set(auth(adminToken))).body.find((c) => c.id === conv.id);
  assert.equal(admin.sector.name, "Geral");
  assert.equal(admin.status, "FINALIZADO");
});
