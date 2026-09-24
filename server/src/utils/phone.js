// Telefones chegam em formatos diferentes: o CRM guarda "+55 92 99999-9999",
// a CoverCut/Meta manda wa_id só com dígitos e, para celulares brasileiros,
// muitas vezes SEM o nono dígito ("559299999999"). Estas funções deixam os
// dois lados comparáveis.

export function onlyDigits(phone = "") {
  return String(phone).replace(/\D/g, "");
}

// Chave de comparação: dígitos, e para celular brasileiro (55 + DDD + 9 + 8
// dígitos) remove o nono dígito — assim "+55 92 99999-9999" e
// "559299999999" viram a mesma chave.
export function phoneKey(phone) {
  const digits = onlyDigits(phone);
  if (digits.length === 13 && digits.startsWith("55") && digits[4] === "9") {
    return digits.slice(0, 4) + digits.slice(5);
  }
  return digits;
}

// Formata um wa_id no padrão já usado no CRM. Celular brasileiro que vier
// sem o nono dígito (número local começando em 6–9) ganha o 9 de volta.
export function formatWaId(waId) {
  let digits = onlyDigits(waId);
  if (!digits.startsWith("55")) return `+${digits}`;

  if (digits.length === 12 && /[6-9]/.test(digits[4])) {
    digits = digits.slice(0, 4) + "9" + digits.slice(4);
  }
  const ddd = digits.slice(2, 4);
  const local = digits.slice(4);
  const split = local.length - 4;
  return `+55 ${ddd} ${local.slice(0, split)}-${local.slice(split)}`;
}
