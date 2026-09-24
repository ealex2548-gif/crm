import { readFile } from "node:fs/promises";
import { WhatsAppProvider } from "./whatsappProvider.js";
import { env } from "../../config/env.js";
import { onlyDigits } from "../../utils/phone.js";

/**
 * Provedor real via CoverCut (BSP sobre o WhatsApp Cloud API da Meta).
 * Docs: https://api.covercut.com.br/docs/
 *
 * CoverCut não usa o handshake GET (hub.challenge) da Meta — a validação
 * do webhook é feita só por assinatura HMAC (X-BSP-Signature), então
 * verifyWebhook() aqui não é usado por nenhuma rota.
 */
export class CoverCutWhatsAppProvider extends WhatsAppProvider {
  constructor() {
    super();
    const { apiKey, apiSecret, baseUrl, phoneNumberId } = env.whatsapp.covercut;
    if (!apiKey || !apiSecret) {
      throw new Error(
        "WHATSAPP_PROVIDER=covercut exige COVERCUT_API_KEY e COVERCUT_API_SECRET no .env."
      );
    }
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.baseUrl = baseUrl;
    this.phoneNumberId = phoneNumberId;
  }

  get #authHeaders() {
    return { "X-API-Key": this.apiKey, "X-API-Secret": this.apiSecret };
  }

  async #request(path, init, action) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: { ...this.#authHeaders, ...init.headers },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      const detail = data?.message ?? data?.error ?? `HTTP ${res.status}`;
      const err = new Error(`CoverCut: falha ao ${action} (${res.status}) ${detail}`);
      // Vai para o atendente pelo errorHandler — ex.: janela de 24h vencida.
      err.status = 502;
      err.publicMessage = `WhatsApp recusou o envio: ${detail}`;
      throw err;
    }
    return data;
  }

  #send(body) {
    return this.#request(
      "/messages/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(this.phoneNumberId && { from: this.phoneNumberId }), ...body }),
      },
      "enviar mensagem"
    );
  }

  // Sobe o arquivo para a Meta e devolve o media_id. Evita depender de um
  // link https público (a VPS ainda roda só por IP, em http).
  async #uploadMedia(filePath, mimetype, filename) {
    const form = new FormData();
    form.append("file", new Blob([await readFile(filePath)], { type: mimetype }), filename);
    if (this.phoneNumberId) form.append("from", this.phoneNumberId);

    const data = await this.#request("/media/upload", { method: "POST", body: form }, "subir mídia");
    return data.media_id;
  }

  async sendTextMessage(to, body) {
    const data = await this.#send({ to: onlyDigits(to), type: "text", text: { body } });
    return { id: data.message_id };
  }

  async sendMediaMessage(to, mediaUrl, meta = {}) {
    const type = mimeToCoverCutType(meta.mimetype);
    const payload = meta.filePath
      ? { id: await this.#uploadMedia(meta.filePath, meta.mimetype, meta.filename ?? "arquivo") }
      : { link: mediaUrl };
    if (type === "document") payload.filename = meta.filename ?? "arquivo";
    else if (meta.caption && type !== "audio") payload.caption = meta.caption;

    const data = await this.#send({ to: onlyDigits(to), type, [type]: payload });
    return { id: data.message_id };
  }

  verifyWebhook(_query) {
    return null;
  }

  parseWebhookPayload(body) {
    // O exemplo "completo" da doc não traz direction — só rejeitamos quando
    // ele vier explicitamente diferente de inbound.
    if (body?.event !== "message") return [];
    if (body.direction && body.direction !== "inbound") return [];

    const message = body.message ?? {};
    const isText = message.type === "text";

    return [
      {
        from: body.contact?.wa_id ?? body.from_number ?? null,
        name: body.contact?.name ?? null,
        // Doc manda text como string; aceita também o formato Meta { body }.
        text: isText ? message.text?.body ?? message.text : mediaPlaceholder(message),
        type: isText ? "TEXT" : "MEDIA",
        whatsappMessageId: message.id ?? `covercut_in_${Date.now()}`,
        timestamp: new Date().toISOString(),
      },
    ];
  }

  // Evento "status": { id: wamid, status: sent|delivered|read|failed }
  parseStatusPayload(body) {
    if (body?.event !== "status" || !body.status?.id) return null;
    const status = STATUS_MAP[body.status.status];
    return status ? { whatsappMessageId: body.status.id, status } : null;
  }
}

const STATUS_MAP = { sent: "SENT", delivered: "DELIVERED", read: "READ", failed: "FAILED" };

function mimeToCoverCutType(mimetype = "") {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "document";
}

// Baixar o conteúdo de mídia recebida exige o endpoint GET /media/get da
// CoverCut (fora do escopo desta primeira integração) — por ora só
// registramos que algo chegou, sem o arquivo.
function mediaPlaceholder(message) {
  if (message.type === "unsupported") return "[mensagem não suportada pelo WhatsApp]";
  return `[${message.type ?? "mídia"} recebido(a)]`;
}
