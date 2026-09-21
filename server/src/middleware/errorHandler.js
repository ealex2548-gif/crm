export function notFoundHandler(req, res) {
  res.status(404).json({ error: "Rota não encontrada" });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status ?? 500;
  res.status(status).json({ error: err.publicMessage ?? "Erro interno do servidor" });
}
