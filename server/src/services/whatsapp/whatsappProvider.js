/**
 * Contrato que qualquer provedor de WhatsApp precisa implementar.
 * Hoje só existe o MockProvider; quando a conta Meta Business/WABA estiver
 * aprovada, um CloudApiProvider real implementa a mesma interface e é
 * selecionado via WHATSAPP_PROVIDER no .env — nada além deste arquivo
 * precisa mudar no resto do backend.
 *
 * sendTextMessage(to, body) -> Promise<{ id: string }>
 * sendMediaMessage(to, mediaUrl, meta?) -> Promise<{ id: string }>
 *   meta opcional: { mimetype, filename, caption } — usado por provedores
 *   reais para escolher o tipo (image/video/audio/document) e legendas.
 * verifyWebhook(query) -> string | null   (challenge do handshake da Meta)
 * parseWebhookPayload(body) -> { from, text, whatsappMessageId, timestamp }[]
 */
export class WhatsAppProvider {
  async sendTextMessage(_to, _body) {
    throw new Error("sendTextMessage não implementado");
  }

  async sendMediaMessage(_to, _mediaUrl, _meta) {
    throw new Error("sendMediaMessage não implementado");
  }

  verifyWebhook(_query) {
    throw new Error("verifyWebhook não implementado");
  }

  parseWebhookPayload(_body) {
    throw new Error("parseWebhookPayload não implementado");
  }
}
