import { test } from "node:test";
import assert from "node:assert/strict";
import { onlyDigits, phoneKey, formatWaId } from "../src/utils/phone.js";

test("phoneKey iguala formato do CRM e wa_id sem nono dígito", () => {
  assert.equal(phoneKey("+55 92 99999-9999"), phoneKey("559299999999"));
  assert.equal(phoneKey("5592999999999"), "559299999999");
  assert.notEqual(phoneKey("+55 92 99999-9999"), phoneKey("+55 92 98888-1111"));
});

test("formatWaId devolve o padrão do CRM, repondo o nono dígito", () => {
  assert.equal(formatWaId("559277776666"), "+55 92 97777-6666");
  assert.equal(formatWaId("5592977776666"), "+55 92 97777-6666");
  assert.equal(formatWaId("559233334444"), "+55 92 3333-4444", "fixo não ganha nono dígito");
  assert.equal(formatWaId("12025550123"), "+12025550123");
});

test("onlyDigits limpa o número para envio", () => {
  assert.equal(onlyDigits("+55 92 99999-9999"), "5592999999999");
});
