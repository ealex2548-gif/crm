import { WhatsAppProvider } from "./whatsappProvider.js";

/**
 * Provedor usado enquanto não há conta Meta Business/WABA aprovada.
 * Não envia nada de verdade: só loga e devolve um id falso, para que
 * o resto do sistema (conversas, mensagens, filas, WebSocket) já
 * funcione de ponta a ponta antes da integração real existir.
 */
export class MockWhatsAppProvider extends WhatsAppProvider {
  async sendTextMessage(to, body) {
    const id = `mock_${Date.now()}`;
    console.log(`[whatsapp:mock] enviando para ${to}: "${body}" (id=${id})`);
    return { id };
  }

  async sendMediaMessage(to, mediaUrl) {
    const id = `mock_${Date.now()}`;
    console.log(`[whatsapp:mock] enviando mídia para ${to}: ${mediaUrl} (id=${id})`);
    return { id };
  }

  verifyWebhook(query) {
    return query?.["hub.challenge"] ?? null;
  }

  parseWebhookPayload(body) {
    if (!body?.from || !body?.text) return [];
    return [
      {
        from: body.from,
        text: body.text,
        whatsappMessageId: body.id ?? `mock_in_${Date.now()}`,
        timestamp: body.timestamp ?? new Date().toISOString(),
      },
    ];
  }
}
