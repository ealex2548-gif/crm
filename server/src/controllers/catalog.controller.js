import { prisma } from "../config/prisma.js";

export async function listSectors(req, res) {
  res.json(await prisma.sector.findMany({ orderBy: { name: "asc" } }));
}

export async function listQuickReplies(req, res) {
  res.json(await prisma.quickReply.findMany({ orderBy: { category: "asc" } }));
}

export async function listKnowledgeArticles(req, res) {
  res.json(await prisma.knowledgeArticle.findMany({ orderBy: { category: "asc" } }));
}
