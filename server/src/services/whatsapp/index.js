import { env } from "../../config/env.js";
import { MockWhatsAppProvider } from "./mockProvider.js";

function createProvider() {
  switch (env.whatsapp.provider) {
    case "mock":
      return new MockWhatsAppProvider();
    default:
      throw new Error(
        `WHATSAPP_PROVIDER="${env.whatsapp.provider}" ainda não tem implementação. ` +
        `Crie um provider real (ex: cloudApiProvider.js) e registre-o aqui.`
      );
  }
}

export const whatsappProvider = createProvider();
