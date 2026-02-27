/**
 * Cliente de Token de Autenticação (Client-Side)
 *
 * Única fonte de verdade para o token no browser.
 * Usa auth_token como chave para compatibilidade com código existente.
 *
 * IMPORTANTE: Executa apenas no browser (typeof window !== "undefined").
 * No SSR, getAuthToken retorna null e set/clear são no-op.
 */

const AUTH_TOKEN_KEY = "auth_token";

/**
 * Obtém o token de autenticação do localStorage
 */
export function getAuthToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Define o token de autenticação no localStorage
 */
export function setAuthToken(token: string): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Remove o token de autenticação do localStorage
 */
export function clearAuthToken(): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(AUTH_TOKEN_KEY);
}
