// Remove os clientes de exemplo do protótipo (prisma/seedData/contacts.js)
// junto com as conversas, mensagens e tickets deles, e desativa os atendentes
// de exemplo (senha padrão pública). Apaga também as respostas rápidas e os
// artigos da Base que são exatamente os do protótipo (os cadastrados pela
// equipe não são tocados). Atendentes são desativados, não apagados,
// para não quebrar histórico de mensagens e auditoria.
//
// Sem argumentos só mostra o que seria apagado. Para apagar de verdade:
//   node scripts/remove-demo-data.js --apply
import { PrismaClient } from "@prisma/client";
import { contacts as demoContacts } from "../prisma/seedData/contacts.js";
import { AGENT_SEED_USERS } from "../prisma/seedData/agents.js";
import { quickReplies as demoQuickReplies } from "../prisma/seedData/quickReplies.js";
import { knowledgeBase as demoArticles } from "../prisma/seedData/knowledgeBase.js";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const contacts = await prisma.contact.findMany({
    where: { phone: { in: demoContacts.map((c) => c.phone) } },
    select: { id: true, name: true, phone: true },
  });
  const contactIds = contacts.map((c) => c.id);
  const conversations = await prisma.conversation.findMany({
    where: { contactId: { in: contactIds } },
    select: { id: true },
  });
  const conversationIds = conversations.map((c) => c.id);

  const demoAgents = await prisma.user.findMany({
    where: { email: { in: AGENT_SEED_USERS.map((u) => u.email) }, active: true },
    select: { id: true, name: true, email: true },
  });

  const demoReplyBodies = Object.values(demoQuickReplies).flat();
  const demoArticleTitles = demoArticles.map(([, title]) => title);
  const replyWhere = { body: { in: demoReplyBodies } };
  const articleWhere = { title: { in: demoArticleTitles } };

  const counts = {
    mensagens: await prisma.message.count({ where: { conversationId: { in: conversationIds } } }),
    tickets: await prisma.ticket.count({ where: { contactId: { in: contactIds } } }),
    conversas: conversationIds.length,
    contatos: contactIds.length,
    atendentesADesativar: demoAgents.length,
    respostasRapidas: await prisma.quickReply.count({ where: replyWhere }),
    artigosBase: await prisma.knowledgeArticle.count({ where: articleWhere }),
  };

  console.log("Contatos de exemplo encontrados:");
  for (const c of contacts) console.log(`  - ${c.name} (${c.phone})`);
  console.log("Atendentes de exemplo ativos:");
  for (const u of demoAgents) console.log(`  - ${u.name} (${u.email})`);
  console.log("Total:", counts);

  if (!apply) {
    console.log("\nNada foi apagado. Rode com --apply para apagar.");
    return;
  }

  await prisma.$transaction([
    prisma.message.deleteMany({ where: { conversationId: { in: conversationIds } } }),
    prisma.ticket.deleteMany({ where: { contactId: { in: contactIds } } }),
    prisma.conversation.deleteMany({ where: { id: { in: conversationIds } } }),
    prisma.contact.deleteMany({ where: { id: { in: contactIds } } }),
    prisma.quickReply.deleteMany({ where: replyWhere }),
    prisma.knowledgeArticle.deleteMany({ where: articleWhere }),
    prisma.user.updateMany({ where: { id: { in: demoAgents.map((u) => u.id) } }, data: { active: false } }),
  ]);
  console.log("\nApagado.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
