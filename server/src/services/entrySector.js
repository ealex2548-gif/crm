import { prisma } from "../config/prisma.js";

// Setor de entrada: toda conversa nova chega nele, e é para ele que a conversa
// volta quando o atendimento é finalizado. Como o número também recebe conversas
// pessoais do dono, nenhum atendente deve ficar neste setor — só Admin/Supervisor
// (que veem tudo) cuidam dele e distribuem para os outros setores.
export const ENTRY_SECTOR_NAME = "Geral";

let cachedId = null;

// Cria o setor na primeira vez (bancos antigos não têm) e guarda o id.
export async function getEntrySectorId() {
  if (cachedId) return cachedId;
  const sector = await prisma.sector.upsert({
    where: { name: ENTRY_SECTOR_NAME },
    update: {},
    create: { name: ENTRY_SECTOR_NAME },
  });
  cachedId = sector.id;
  return cachedId;
}
