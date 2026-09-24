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

  // Baixa uma mídia recebida (ou enviada pelo celular) pelo media_id do webhook.
  async downloadMedia(mediaId) {
    const params = new URLSearchParams({ id: mediaId, mode: "stream" });
    if (this.phoneNumberId) params.set("from", this.phoneNumberId);

    const res = await fetch(`${this.baseUrl}/media/get?${params}`, { headers: this.#authHeaders });
    const mimetype = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || mimetype === "application/json") {
      const detail = await res.text().catch(() => "");
      throw new Error(`CoverCut: falha ao baixar mídia ${mediaId} (${res.status}) ${detail.slice(0, 200)}`);
    }
    return { buffer: Buffer.from(await res.arrayBuffer()), mimetype };
  }

  verifyWebhook(_query) {
    return null;
  }

  parseWebhookPayload(body) {
    let direction;
    if (body?.event === "message") {
      // O exemplo "completo" da doc não traz direction — só rejeitamos quando
      // ele vier explicitamente diferente de inbound.
      if (body.direction && body.direction !== "inbound") return [];
      direction = "IN";
    } else if (body?.event === "echo") {
      // Echo "phone" = resposta digitada no app do WhatsApp do celular
      // (coexistência). Echo "api" é o que o próprio CRM enviou e já gravou.
      if (body.echo_source === "api") return [];
      direction = "OUT";
    } else {
      return [];
    }

    const message = body.message ?? {};
    const isText = message.type === "text";
    // Formato Meta: message.image = { id, mime_type, caption }, idem video/audio/document/sticker.
    const media = isText ? null : message[message.type];

    return [
      {
        media: media?.id
          ? { id: media.id, mimetype: media.mime_type, caption: media.caption, filename: media.filename }
          : null,
        direction,
        raw: isText ? undefined : message,
        // Em mensagem e em echo, contact é sempre o cliente.
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

// Texto da mensagem de mídia (o arquivo em si é baixado pelo webhook via
// downloadMedia) — também é o que aparece na prévia da lista de conversas.
const MEDIA_LABELS = { image: "📷 Imagem", video: "🎬 Vídeo", audio: "🎤 Áudio", document: "📄 Documento", sticker: "Figurinha" };

function mediaPlaceholder(message) {
  if (message.type === "unsupported") return "[mensagem não suportada pelo WhatsApp]";
  return MEDIA_LABELS[message.type] ?? `[${message.type ?? "mídia"}]`;
}
