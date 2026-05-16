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
  "CRON_SECRET",
  "NODE_ENV",
] as const;

const validNodeEnvs = new Set(["development", "test", "production"]);
const validPayoutExecutionModes = new Set(["fake", "real"]);

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

  const payoutMode = process.env.PAYOUT_EXECUTION_MODE?.trim();
  if (payoutMode && !validPayoutExecutionModes.has(payoutMode)) {
    throw new Error(`Invalid PAYOUT_EXECUTION_MODE: ${payoutMode}`);
  }
}
