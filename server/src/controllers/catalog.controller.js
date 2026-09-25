import { prisma } from "../config/prisma.js";
import { recordAudit } from "../services/auditLog.js";

export async function listSectors(req, res) {
  res.json(await prisma.sector.findMany({ orderBy: { name: "asc" } }));
}

export async function listQuickReplies(req, res) {
  res.json(await prisma.quickReply.findMany({ orderBy: [{ category: "asc" }, { body: "asc" }] }));
}

function readQuickReply(body) {
  const category = body?.category?.trim();
  const text = body?.body?.trim();
  return category && text ? { category, body: text } : null;
}

export async function createQuickReply(req, res) {
  const data = readQuickReply(req.body);
  if (!data) return res.status(400).json({ error: "Informe categoria e texto" });
  const reply = await prisma.quickReply.create({ data });
  await recordAudit({ userId: req.user.sub, action: "quickReply.created", entityType: "QuickReply", entityId: reply.id });
  res.status(201).json(reply);
}

export async function updateQuickReply(req, res) {
  const data = readQuickReply(req.body);
  if (!data) return res.status(400).json({ error: "Informe categoria e texto" });
  const reply = await prisma.quickReply.update({ where: { id: req.params.id }, data });
  await recordAudit({ userId: req.user.sub, action: "quickReply.updated", entityType: "QuickReply", entityId: reply.id });
  res.json(reply);
}

export async function deleteQuickReply(req, res) {
  await prisma.quickReply.delete({ where: { id: req.params.id } });
  await recordAudit({ userId: req.user.sub, action: "quickReply.deleted", entityType: "QuickReply", entityId: req.params.id });
  res.status(204).end();
}

export async function listKnowledgeArticles(req, res) {
  res.json(await prisma.knowledgeArticle.findMany({ orderBy: [{ category: "asc" }, { title: "asc" }] }));
}

function readArticle(body) {
  const category = body?.category?.trim();
  const title = body?.title?.trim();
  const text = body?.body?.trim();
  return category && title && text ? { category, title, body: text } : null;
}

export async function createKnowledgeArticle(req, res) {
  const data = readArticle(req.body);
  if (!data) return res.status(400).json({ error: "Informe categoria, título e texto" });
  const article = await prisma.knowledgeArticle.create({ data });
  await recordAudit({ userId: req.user.sub, action: "article.created", entityType: "KnowledgeArticle", entityId: article.id });
  res.status(201).json(article);
}

export async function updateKnowledgeArticle(req, res) {
  const data = readArticle(req.body);
  if (!data) return res.status(400).json({ error: "Informe categoria, título e texto" });
  const article = await prisma.knowledgeArticle.update({ where: { id: req.params.id }, data });
  await recordAudit({ userId: req.user.sub, action: "article.updated", entityType: "KnowledgeArticle", entityId: article.id });
  res.json(article);
}

export async function deleteKnowledgeArticle(req, res) {
  await prisma.knowledgeArticle.delete({ where: { id: req.params.id } });
  await recordAudit({ userId: req.user.sub, action: "article.deleted", entityType: "KnowledgeArticle", entityId: req.params.id });
  res.status(204).end();
}
