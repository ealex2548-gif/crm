import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// Dados iniciais (mesmo conteúdo do protótipo frontend original). Vivem
// aqui dentro de server/ — e não em src/data/ na raiz do repo — porque o
// build Docker do backend só enxerga a pasta server/ como contexto; um
// import cruzando essa fronteira funciona em dev local mas quebra no
// container.
import { contacts as mockContacts } from "./seedData/contacts.js";
import { initialMessages as mockMessages } from "./seedData/messages.js";
import { initialTickets as mockTickets } from "./seedData/tickets.js";
import { quickReplies as mockQuickReplies } from "./seedData/quickReplies.js";
import { knowledgeBase as mockKnowledgeBase } from "./seedData/knowledgeBase.js";
import { SECTORS } from "./seedData/sectors.js";

const prisma = new PrismaClient();

const PRIORITY_MAP = { Baixa: "BAIXA", Normal: "NORMAL", Alta: "ALTA", Urgente: "URGENTE" };
const TICKET_STATUS_MAP = {
  Novo: "NOVO",
  "Em atendimento": "EM_ATENDIMENTO",
  "Aguardando cliente": "AGUARDANDO_CLIENTE",
  Finalizado: "FINALIZADO",
};

const AGENT_SEED_USERS = [
  { name: "João Silva", email: "joao.silva@seucrm.com" },
  { name: "Ana Souza", email: "ana.souza@seucrm.com" },
  { name: "Carlos Lima", email: "carlos.lima@seucrm.com" },
];

async function main() {
  console.log("Seeding setores...");
  const sectorByName = {};
  for (const name of SECTORS) {
    sectorByName[name] = await prisma.sector.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log("Seeding usuários...");
  const defaultPasswordHash = await bcrypt.hash("mudar123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@seucrm.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@seucrm.com",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
    },
  });

  const userByName = { [admin.name]: admin };
  for (const agent of AGENT_SEED_USERS) {
    userByName[agent.name] = await prisma.user.upsert({
      where: { email: agent.email },
      update: {},
      create: {
        name: agent.name,
        email: agent.email,
        passwordHash: defaultPasswordHash,
        role: "AGENT",
      },
    });
  }

  console.log("Seeding contatos e conversas...");
  const contactById = {};
  const conversationByMockContactId = {};
  for (const c of mockContacts) {
    const contact = await prisma.contact.upsert({
      where: { phone: c.phone },
      update: {},
      create: {
        name: c.name,
        phone: c.phone,
        company: c.company,
        city: c.city,
        plan: c.plan,
        pdvVersion: c.version,
        pdvTerminals: c.terminals,
        pdvDatabase: c.db,
        sectorId: sectorByName[c.sector]?.id,
      },
    });
    contactById[c.id] = contact;

    const conversation = await prisma.conversation.create({
      data: {
        contactId: contact.id,
        sectorId: sectorByName[c.sector]?.id,
        assignedAgentId: userByName[c.agent]?.id,
        priority: PRIORITY_MAP[c.priority] ?? "NORMAL",
        status: "EM_ATENDIMENTO",
      },
    });
    conversationByMockContactId[c.id] = conversation;

    const messages = mockMessages[c.id] ?? [];
    for (const m of messages) {
      const direction = m.side === "in" ? "IN" : "OUT";
      const type = m.side === "note" ? "NOTE" : "TEXT";
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          direction,
          type,
          body: m.text,
          sentById: type !== "TEXT" || direction === "OUT" ? userByName[c.agent]?.id : undefined,
        },
      });
    }
  }

  console.log("Seeding tickets...");
  for (const t of mockTickets) {
    const contact = mockContacts.find((c) => c.company === t.client);
    if (!contact) continue;
    await prisma.ticket.create({
      data: {
        contactId: contactById[contact.id].id,
        conversationId: conversationByMockContactId[contact.id]?.id,
        title: t.title,
        status: TICKET_STATUS_MAP[t.status] ?? "NOVO",
        priority: PRIORITY_MAP[t.priority] ?? "NORMAL",
        ownerId: userByName[t.owner]?.id,
      },
    });
  }

  console.log("Seeding respostas rápidas...");
  for (const [category, replies] of Object.entries(mockQuickReplies)) {
    for (const body of replies) {
      await prisma.quickReply.create({ data: { category, body } });
    }
  }

  console.log("Seeding base de conhecimento...");
  for (const [category, title, body] of mockKnowledgeBase) {
    await prisma.knowledgeArticle.create({ data: { category, title, body } });
  }

  console.log("Seed concluído. Login padrão: admin@seucrm.com / mudar123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
