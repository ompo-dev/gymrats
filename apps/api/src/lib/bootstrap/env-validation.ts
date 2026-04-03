const requiredEnvVars = [
  "BETTER_AUTH_SECRET",
  "DATABASE_URL",
  "REDIS_URL",
  "ABACATEPAY_API_TOKEN",
  "ABACATEPAY_WEBHOOK_SECRET",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "NODE_ENV",
] as const;

const validNodeEnvs = new Set(["development", "test", "production"]);

export function validateEnvironment() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  const nodeEnv = process.env.NODE_ENV ?? "";
  if (!validNodeEnvs.has(nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnv}`);
  }
}
