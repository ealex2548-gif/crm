import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync, mkdirSync } from "node:fs";
import path from "node:path";
import request from "supertest";

const TEST_DB = path.resolve(import.meta.dirname, "tmp", "webhook-test.db");
const WEBHOOK_SECRET = "test-webhook-secret";

process.env.DATABASE_URL = `file:${TEST_DB}`;
process.env.JWT_SECRET = "test-secret-not-for-production-aaaaaaaaaaaaaaaaaaaaaa";
process.env.NODE_ENV = "test";
process.env.WHATSAPP_PROVIDER = "covercut";
process.env.COVERCUT_API_KEY = "test-key";
process.env.COVERCUT_API_SECRET = "test-secret";
process.env.COVERCUT_WEBHOOK_SECRET = WEBHOOK_SECRET;

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

after(async () => {
  await prisma.$disconnect();
  if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
});

const app = createApp();

function sign(body) {
  const raw = JSON.stringify(body);
  return crypto.createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex");
}

async function waitForMessage(whatsappMessageId) {
  for (let i = 0; i < 40; i++) {
    const message = await prisma.message.findFirst({ where: { whatsappMessageId } });
    if (message) return message;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return null;
}

test("webhook covercut rejeita assinatura ausente/errada", async () => {
  const body = {
    event: "message",
    direction: "inbound",
    contact: { wa_id: "5547999990000", name: "Cliente Webhook" },
    message: { id: "wamid_no_sig", type: "text", text: "Oi" },
  };
  const res = await request(app).post("/api/webhooks/covercut").send(body);
  assert.equal(res.status, 401);

  const resWrong = await request(app)
    .post("/api/webhooks/covercut")
    .set("x-bsp-signature", "assinatura-invalida")
    .send(body);
  assert.equal(resWrong.status, 401);

  const message = await prisma.message.findFirst({ where: { whatsappMessageId: "wamid_no_sig" } });
  assert.equal(message, null);
});

test("webhook covercut com assinatura válida cria contato, conversa e mensagem", async () => {
  const body = {
    event: "message",
    direction: "inbound",
    from_number_id: "123456789012345",
    contact: { wa_id: "5547988887777", name: "João Silva" },
    message: { id: "wamid_valido_1", type: "text", text: "Olá, preciso de ajuda" },
  };
  const res = await request(app)
    .post("/api/webhooks/covercut")
    .set("x-bsp-signature", sign(body))
    .send(body);
  assert.equal(res.status, 200);
  assert.equal(res.body.received, true);

  const message = await waitForMessage("wamid_valido_1");
  assert.ok(message, "mensagem deveria ter sido criada de forma assíncrona");
  assert.equal(message.direction, "IN");
  assert.equal(message.body, "Olá, preciso de ajuda");

  const contact = await prisma.contact.findUnique({ where: { phone: "+55 47 98888-7777" } });
  assert.ok(contact);
  assert.equal(contact.name, "João Silva");

  const conversation = await prisma.conversation.findFirst({ where: { contactId: contact.id } });
  assert.ok(conversation);
  assert.equal(conversation.status, "EM_ATENDIMENTO");
});

test("webhook covercut ignora echo da própria API (evita mensagem duplicada)", async () => {
  const body = {
    event: "echo",
    direction: "outbound",
    echo_source: "api",
    contact: { wa_id: "5547988887777", name: "João Silva" },
    message: { id: "wamid_echo_1", type: "text", text: "Já vou te ajudar" },
  };
  const res = await request(app)
    .post("/api/webhooks/covercut")
    .set("x-bsp-signature", sign(body))
    .send(body);
  assert.equal(res.status, 200);

  await new Promise((resolve) => setTimeout(resolve, 100));
  const message = await prisma.message.findFirst({ where: { whatsappMessageId: "wamid_echo_1" } });
  assert.equal(message, null);
});

test("webhook covercut reaproveita conversa aberta existente do mesmo contato", async () => {
  const body = {
    event: "message",
    direction: "inbound",
    contact: { wa_id: "5547988887777", name: "João Silva" },
    message: { id: "wamid_valido_2", type: "text", text: "Segunda mensagem" },
  };
  const res = await request(app)
    .post("/api/webhooks/covercut")
    .set("x-bsp-signature", sign(body))
    .send(body);
  assert.equal(res.status, 200);

  await waitForMessage("wamid_valido_2");
  const contact = await prisma.contact.findUnique({ where: { phone: "+55 47 98888-7777" } });
  const conversations = await prisma.conversation.findMany({ where: { contactId: contact.id } });
  assert.equal(conversations.length, 1, "não deveria criar uma segunda conversa para o mesmo contato ainda em atendimento");
});

test("webhook covercut sem direction (exemplo completo da doc) ainda é processado", async () => {
  const body = {
    event: "message",
    from_number_id: "950147584848138",
    contact: { wa_id: "5547988887777", name: "João Silva" },
    message: { id: "wamid_sem_direction", type: "text", text: "Ola" },
  };
  await request(app).post("/api/webhooks/covercut").set("x-bsp-signature", sign(body)).send(body);
  const message = await waitForMessage("wamid_sem_direction");
  assert.ok(message);
});

test("webhook covercut casa wa_id sem o nono dígito com contato já cadastrado", async () => {
  const existing = await prisma.contact.create({
    data: { name: "Cliente Antigo", phone: "+55 92 97777-6666" },
  });
  const body = {
    event: "message",
    direction: "inbound",
    contact: { wa_id: "559277776666", name: "Nome no WhatsApp" },
    message: { id: "wamid_sem_nono", type: "text", text: "Oi" },
  };
  await request(app).post("/api/webhooks/covercut").set("x-bsp-signature", sign(body)).send(body);
  const message = await waitForMessage("wamid_sem_nono");
  const conversation = await prisma.conversation.findUnique({ where: { id: message.conversationId } });
  assert.equal(conversation.contactId, existing.id, "não deveria criar contato duplicado");

  const contact = await prisma.contact.findUnique({ where: { id: existing.id } });
  assert.equal(contact.name, "Cliente Antigo", "não deveria sobrescrever nome já cadastrado");
});

test("webhook covercut reenviado não duplica a mensagem", async () => {
  const body = {
    event: "message",
    direction: "inbound",
    contact: { wa_id: "5547988887777", name: "João Silva" },
    message: { id: "wamid_repetido", type: "text", text: "Repetida" },
  };
  for (let i = 0; i < 2; i++) {
    await request(app).post("/api/webhooks/covercut").set("x-bsp-signature", sign(body)).send(body);
    await waitForMessage("wamid_repetido");
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
  const count = await prisma.message.count({ where: { whatsappMessageId: "wamid_repetido" } });
  assert.equal(count, 1);
});

test("webhook covercut de status atualiza mensagem enviada sem rebaixar", async () => {
  const conversation = await prisma.conversation.findFirst();
  const sent = await prisma.message.create({
    data: { conversationId: conversation.id, direction: "OUT", body: "Oi", whatsappMessageId: "wamid_out_1", status: "SENT" },
  });

  async function sendStatus(status) {
    const body = { event: "status", from_number_id: "1", status: { id: "wamid_out_1", status, recipient: "5547988887777" } };
    await request(app).post("/api/webhooks/covercut").set("x-bsp-signature", sign(body)).send(body);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return (await prisma.message.findUnique({ where: { id: sent.id } })).status;
  }

  assert.equal(await sendStatus("read"), "READ");
  assert.equal(await sendStatus("delivered"), "READ", "delivered atrasado não pode rebaixar read");
});

test("webhook covercut grava echo do celular como mensagem enviada (OUT)", async () => {
  const body = {
    event: "echo",
    direction: "outbound",
    echo_source: "phone",
    contact: { wa_id: "5547988887777", name: "João Silva" },
    message: { id: "wamid_echo_phone", type: "text", text: "Respondi pelo celular" },
  };
  await request(app).post("/api/webhooks/covercut").set("x-bsp-signature", sign(body)).send(body);
  const message = await waitForMessage("wamid_echo_phone");
  assert.ok(message, "resposta dada no celular deveria aparecer no CRM");
  assert.equal(message.direction, "OUT");
  assert.equal(message.body, "Respondi pelo celular");

  const contact = await prisma.contact.findUnique({ where: { phone: "+55 47 98888-7777" } });
  const conversation = await prisma.conversation.findUnique({ where: { id: message.conversationId } });
  assert.equal(conversation.contactId, contact.id, "echo entra na conversa do cliente, não do número da empresa");
});
