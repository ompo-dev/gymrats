import { afterEach, describe, expect, it } from "vitest";
import { validateEnvironment } from "./env-validation";

const REQUIRED_ENV = {
  BETTER_AUTH_SECRET: "secret",
  DATABASE_URL: "postgres://localhost:5432/gymrats",
  REDIS_URL: "redis://localhost:6379",
  ABACATEPAY_API_TOKEN: "token",
  ABACATEPAY_WEBHOOK_SECRET: "webhook-secret",
  EMAIL_USER: "noreply@gymrats.app",
  EMAIL_PASSWORD: "password",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  NODE_ENV: "test",
} as const;

const originalEnv = { ...process.env };

describe("validateEnvironment", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("passes when all required variables are present", () => {
    process.env = {
      ...originalEnv,
      ...REQUIRED_ENV,
    };

    expect(() => validateEnvironment()).not.toThrow();
  });

  it("throws when a required secret is missing", () => {
    process.env = {
      ...originalEnv,
      ...REQUIRED_ENV,
    };
    delete process.env.EMAIL_PASSWORD;

    expect(() => validateEnvironment()).toThrow(/EMAIL_PASSWORD/);
  });

  it("throws when NODE_ENV is invalid", () => {
    process.env = {
      ...originalEnv,
      ...REQUIRED_ENV,
      NODE_ENV: "staging",
    };

    expect(() => validateEnvironment()).toThrow(/Invalid NODE_ENV/);
  });
});
