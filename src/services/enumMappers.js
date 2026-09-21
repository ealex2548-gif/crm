// A API guarda prioridade/status em maiúsculas (sem enum nativo no SQLite —
// ver server/src/constants/enums.js). O restante do frontend (Badge, selects,
// comparações de className) continua trabalhando com os mesmos textos em
// português que já usava no protótipo — a tradução acontece só aqui, na borda.

const PRIORITY_TO_DISPLAY = { BAIXA: "Baixa", NORMAL: "Normal", ALTA: "Alta", URGENTE: "Urgente" };
const PRIORITY_TO_API = { Baixa: "BAIXA", Normal: "NORMAL", Alta: "ALTA", Urgente: "URGENTE" };

const TICKET_STATUS_TO_DISPLAY = {
  NOVO: "Novo",
  EM_ATENDIMENTO: "Em atendimento",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  FINALIZADO: "Finalizado",
};
const TICKET_STATUS_TO_API = Object.fromEntries(
  Object.entries(TICKET_STATUS_TO_DISPLAY).map(([api, display]) => [display, api])
);

export const priorityToDisplay = (value) => PRIORITY_TO_DISPLAY[value] ?? value;
export const priorityToApi = (value) => PRIORITY_TO_API[value] ?? value;
export const ticketStatusToDisplay = (value) => TICKET_STATUS_TO_DISPLAY[value] ?? value;
export const ticketStatusToApi = (value) => TICKET_STATUS_TO_API[value] ?? value;
