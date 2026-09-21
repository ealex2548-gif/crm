import "dotenv/config";

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = required("JWT_SECRET", nodeEnv === "development" ? "dev-secret-change-me" : undefined);

const WEAK_JWT_SECRETS = ["change-me-to-a-long-random-string", "dev-secret-change-me"];
if (nodeEnv === "production" && (WEAK_JWT_SECRETS.includes(jwtSecret) || jwtSecret.length < 32)) {
  throw new Error(
    "JWT_SECRET está com o valor de exemplo ou é curto demais para produção. " +
    "Gere um valor aleatório forte (ex: `openssl rand -hex 32`) antes de subir."
  );
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv,
  databaseUrl: required("DATABASE_URL"),
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER ?? "mock",
    token: process.env.WHATSAPP_TOKEN ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
  },
};
