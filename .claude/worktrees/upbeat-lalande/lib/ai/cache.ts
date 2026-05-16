/**
 * Sistema de Cache Inteligente para Prompts de IA
 *
 * Reduz custo em até 90% para prompts similares
 * Cache em memória (pode ser migrado para Redis em produção)
 */

interface CachedResponse {
	promptHash: string;
	response: string;
	timestamp: number;
	ttl: number; // Time to live em segundos
}

const promptCache = new Map<string, CachedResponse>();

export function getCachedResponse(
	prompt: string,
	_maxAge: number = 3600, // 1 hora padrão
): string | null {
	const hash = createHash(normalizePrompt(prompt));

	const cached = promptCache.get(hash);

	if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
		return cached.response;
	}

	// Limpar cache expirado
	if (cached) {
		promptCache.delete(hash);
	}

	return null;
}

export function cacheResponse(
	prompt: string,
	response: string,
	ttl: number = 3600, // 1 hora padrão
): void {
	const hash = createHash(normalizePrompt(prompt));

	promptCache.set(hash, {
		promptHash: hash,
		response,
		timestamp: Date.now(),
		ttl,
	});
}

/**
 * Normaliza prompt para cache (remove variações menores)
 * Remove pontuação e normaliza espaços para melhor matching
 */
function normalizePrompt(prompt: string): string {
	return prompt
		.toLowerCase()
		.trim()
		.replace(/\s+/g, " ")
		.replace(/[^\w\s]/g, "");
}

/**
 * Cria hash SHA-256 do prompt
 * Cache funciona principalmente server-side (API routes)
 */
function createHash(text: string): string {
	// Server-side: usar crypto nativo do Node.js
	if (typeof window === "undefined") {
		const crypto = require("node:crypto");
		return crypto.createHash("sha256").update(text).digest("hex");
	}

	// Client-side: hash simples (cache client-side é menos crítico)
	// Em produção, considerar usar Web Crypto API se necessário
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		const char = text.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash.toString(36);
}

/**
 * Limpar cache expirado (chamado periodicamente)
 */
export function cleanupExpiredCache(): void {
	const now = Date.now();
	for (const [hash, cached] of promptCache.entries()) {
		if (now - cached.timestamp >= cached.ttl * 1000) {
			promptCache.delete(hash);
		}
	}
}

// Limpar cache expirado a cada 5 minutos
if (typeof window !== "undefined") {
	setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}
