export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Rota não encontrada" });
}

export function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === "MulterError") {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Arquivo maior que 10MB" : err.message;
    return res.status(400).json({ error: message });
  }
  if (err.message === "Tipo de arquivo não permitido") {
    return res.status(400).json({ error: err.message });
  }

  // Prisma: registro não existe (ex.: editar algo que outra pessoa já apagou).
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado" });
  }

  const status = err.status ?? 500;
  res.status(status).json({ error: err.publicMessage ?? "Erro interno do servidor" });
}
