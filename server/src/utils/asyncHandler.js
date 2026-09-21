// Express 4 não captura rejeições de handlers async sozinho — sem isso,
// qualquer erro (ex: banco fora do ar) derruba o processo inteiro em vez
// de cair no errorHandler central.
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
