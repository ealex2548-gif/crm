// SQLite não tem enum nativo — estes objetos são a fonte da verdade dos
// valores válidos para os campos "tipo enum" (string) do schema.prisma.
// Sempre valide contra eles antes de gravar no banco.

export const ROLES = ["ADMIN", "SUPERVISOR", "AGENT"];

export const PRIORITIES = ["BAIXA", "NORMAL", "ALTA", "URGENTE"];

export const CONVERSATION_STATUSES = [
  "EM_ATENDIMENTO",
  "AGUARDANDO_CLIENTE",
  "AGUARDANDO_EQUIPE",
  "FINALIZADO",
];

export const MESSAGE_DIRECTIONS = ["IN", "OUT"];

export const MESSAGE_TYPES = ["TEXT", "NOTE", "MEDIA"];

export const MESSAGE_STATUSES = ["PENDING", "SENT", "DELIVERED", "READ", "FAILED"];

export const TICKET_STATUSES = ["NOVO", "EM_ATENDIMENTO", "AGUARDANDO_CLIENTE", "FINALIZADO"];
