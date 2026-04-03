import pino from "pino";

const SENSITIVE_KEYS = [
  "password",
  "senha",
  "token",
  "secret",
  "authorization",
  "cookie",
  "email",
  "cellphone",
  "phone",
  "taxid",
  "cpf",
  "cnpj",
  "pixkey",
] as const;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

function sanitize(value: unknown): JsonValue {
  if (value == null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack ?? null,
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (typeof value === "object") {
    const out: Record<string, JsonValue> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      const normalizedKey = key.toLowerCase();
      out[key] = SENSITIVE_KEYS.some((sensitiveKey) =>
        normalizedKey.includes(sensitiveKey),
      )
        ? "[REDACTED]"
        : sanitize(nestedValue);
    }

    return out;
  }

  return String(value);
}

function normalizeMetadata(metadata?: unknown): Record<string, JsonValue> {
  if (metadata == null) {
    return {};
  }

  const sanitized = sanitize(metadata);

  if (
    typeof sanitized === "object" &&
    sanitized !== null &&
    !Array.isArray(sanitized)
  ) {
    return sanitized;
  }

  return { metadata: sanitized };
}

const destination = pino.destination({
  sync: false,
  minLength: 4_096,
});

const logger = pino(
  {
    name: "gymrats",
    level:
      process.env.LOG_LEVEL ??
      (process.env.NODE_ENV === "production" ? "info" : "debug"),
    base: process.env.GYMRATS_RUNTIME_ROLE
      ? { runtime: process.env.GYMRATS_RUNTIME_ROLE }
      : undefined,
    messageKey: "message",
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level(label) {
        return { level: label };
      },
    },
  },
  destination,
);

function write(
  level: "debug" | "info" | "warn" | "error",
  message: string,
  metadata?: unknown,
) {
  const payload = normalizeMetadata(metadata);

  try {
    if (Object.keys(payload).length === 0) {
      logger[level](message);
      return;
    }

    logger[level](payload, message);
  } catch {
    // Never fail request/job execution because of logging I/O.
  }
}

export const log = {
  debug(message: string, metadata?: unknown) {
    write("debug", message, metadata);
  },
  info(message: string, metadata?: unknown) {
    write("info", message, metadata);
  },
  warn(message: string, metadata?: unknown) {
    write("warn", message, metadata);
  },
  error(message: string, metadata?: unknown) {
    write("error", message, metadata);
  },
};
