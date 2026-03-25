/**
 * Logger estruturado compartilhado.
 */

const isDev =
  typeof process !== "undefined" && process.env?.NODE_ENV !== "production";

const SENSITIVE_KEYS = [
  "password",
  "token",
  "secret",
  "authorization",
  "cookie",
];

type LoggablePrimitive = string | number | boolean | null;

interface LoggableObject {
  [key: string]: LoggableValue;
}

type LoggableValue = LoggablePrimitive | LoggableValue[] | LoggableObject;

function sanitize(obj: unknown): LoggableValue {
  if (obj == null) {
    return null;
  }

  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  ) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      stack: obj.stack ?? null,
    };
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const out: Record<string, LoggableValue> = {};
  for (const [key, value] of Object.entries(obj)) {
    const keyLower = key.toLowerCase();
    out[key] = SENSITIVE_KEYS.some((sensitive) => keyLower.includes(sensitive))
      ? "[REDACTED]"
      : sanitize(value);
  }

  return out;
}

function formatMessage(
  level: string,
  message: string,
  ctx?: Record<string, unknown>,
) {
  const sanitized = ctx != null ? (sanitize(ctx) as LoggableObject) : undefined;

  if (isDev) {
    const parts = [`[${level}]`, message];
    if (sanitized != null && Object.keys(sanitized).length > 0) {
      parts.push(JSON.stringify(sanitized));
    }
    return parts;
  }

  return [{ level, message, ...(sanitized as object) }];
}

function write(
  level: "info" | "warn" | "error",
  fn: (...args: (string | object)[]) => void,
  message: string,
  ctx?: Record<string, unknown>,
) {
  const parts = formatMessage(level.toUpperCase(), message, ctx);
  try {
    if (isDev) {
      fn(...parts);
    } else {
      fn(parts[0]);
    }
  } catch {
    // Ignore logging I/O failures.
  }
}

export const log = {
  info(message: string, ctx?: Record<string, unknown>) {
    write("info", console.info.bind(console), message, ctx);
  },
  warn(message: string, ctx?: Record<string, unknown>) {
    write("warn", console.warn.bind(console), message, ctx);
  },
  error(message: string, ctx?: Record<string, unknown>) {
    write("error", console.error.bind(console), message, ctx);
  },
  debug(message: string, ctx?: Record<string, unknown>) {
    if (isDev) {
      write("info", console.debug.bind(console), message, ctx);
    }
  },
};
