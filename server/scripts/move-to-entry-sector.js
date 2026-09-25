// Ajuste único ao adotar o setor de entrada ("Geral"):
//  - conversas sem setor passam para o Geral;
//  - conversas já finalizadas voltam para o Geral, sem responsável
//    (mesma regra que agora vale ao finalizar).
//
// Sem argumentos só mostra o que seria alterado. Para aplicar:
//   node scripts/move-to-entry-sector.js --apply
import { prisma } from "../src/config/prisma.js";
import { getEntrySectorId, ENTRY_SECTOR_NAME } from "../src/services/entrySector.js";

const apply = process.argv.includes("--apply");

async function main() {
  const entryId = await getEntrySectorId();
  const semSetor = { sectorId: null, status: { not: "FINALIZADO" } };
  const finalizadas = { status: "FINALIZADO", OR: [{ sectorId: { not: entryId } }, { sectorId: null }, { assignedAgentId: { not: null } }] };

  console.log(`Setor de entrada: ${ENTRY_SECTOR_NAME}`);
  console.log({
    semSetorParaGeral: await prisma.conversation.count({ where: semSetor }),
    finalizadasDeVoltaAoGeral: await prisma.conversation.count({ where: finalizadas }),
  });

  if (!apply) {
    console.log("\nNada foi alterado. Rode com --apply para aplicar.");
    return;
  }

  await prisma.$transaction([
    prisma.conversation.updateMany({ where: semSetor, data: { sectorId: entryId } }),
    prisma.conversation.updateMany({ where: finalizadas, data: { sectorId: entryId, assignedAgentId: null } }),
  ]);
  console.log("\nAplicado.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
