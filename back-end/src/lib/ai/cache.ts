interface CachedResponse {
  promptHash: string;
  response: string;
  timestamp: number;
  ttl: number;
}

const promptCache = new Map<string, CachedResponse>();

export function getCachedResponse(
  prompt: string,
  maxAge: number = 3600
): string | null {
  const hash = createHash(normalizePrompt(prompt));

  const cached = promptCache.get(hash);

  if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
    return cached.response;
  }

  if (cached) {
    promptCache.delete(hash);
  }

  return null;
}

export function cacheResponse(
  prompt: string,
  response: string,
  ttl: number = 3600
): void {
  const hash = createHash(normalizePrompt(prompt));

  promptCache.set(hash, {
    promptHash: hash,
    response,
    timestamp: Date.now(),
    ttl,
  });
}

function normalizePrompt(prompt: string): string {
  return prompt
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

function createHash(text: string): string {
  if (typeof window === "undefined") {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(text).digest("hex");
  }

  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [hash, cached] of promptCache.entries()) {
    if (now - cached.timestamp >= cached.ttl * 1000) {
      promptCache.delete(hash);
    }
  }
}

if (typeof window !== "undefined") {
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}
