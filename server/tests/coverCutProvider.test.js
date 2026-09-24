import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

process.env.JWT_SECRET = "test-secret-not-for-production-aaaaaaaaaaaaaaaaaaaaaa";
process.env.COVERCUT_API_KEY = "k";
process.env.COVERCUT_API_SECRET = "s";

const { CoverCutWhatsAppProvider } = await import("../src/services/whatsapp/coverCutProvider.js");

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function fakeCoverCut(responses) {
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init });
    const { status = 200, body } = responses.shift();
    return new Response(JSON.stringify(body), { status });
  };
  return calls;
}

test("texto: envia só dígitos no 'to' e usa os headers da CoverCut", async () => {
  const calls = fakeCoverCut([{ body: { success: true, message_id: "wamid.1" } }]);
  const sent = await new CoverCutWhatsAppProvider().sendTextMessage("+55 92 99999-9999", "Olá");

  assert.equal(sent.id, "wamid.1");
  assert.match(calls[0].url, /\/messages\/send$/);
  assert.equal(calls[0].init.headers["X-API-Key"], "k");
  assert.deepEqual(JSON.parse(calls[0].init.body), { to: "5592999999999", type: "text", text: { body: "Olá" } });
});

test("mídia: sobe o arquivo em /media/upload e envia pelo media_id (sem link público)", async () => {
  const dir = path.resolve(import.meta.dirname, "tmp");
  mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, "nota.pdf");
  writeFileSync(filePath, "%PDF-fake");

  const calls = fakeCoverCut([
    { body: { success: true, media_id: "845187" } },
    { body: { success: true, message_id: "wamid.2" } },
  ]);
  await new CoverCutWhatsAppProvider().sendMediaMessage("+55 92 99999-9999", "http://ip/uploads/x.pdf", {
    mimetype: "application/pdf", filename: "nota.pdf", filePath,
  });

  assert.match(calls[0].url, /\/media\/upload$/);
  assert.ok(calls[0].init.body instanceof FormData);
  assert.deepEqual(JSON.parse(calls[1].init.body), {
    to: "5592999999999", type: "document", document: { id: "845187", filename: "nota.pdf" },
  });
});

test("erro da CoverCut vira 502 com mensagem legível para o atendente", async () => {
  fakeCoverCut([{ status: 400, body: { success: false, message: "Fora da janela de 24h" } }]);
  await assert.rejects(new CoverCutWhatsAppProvider().sendTextMessage("5592999999999", "Oi"), (err) => {
    assert.equal(err.status, 502);
    assert.match(err.publicMessage, /Fora da janela de 24h/);
    return true;
  });
});
