/**
 * Helper utilities para trabalhar com params e searchParams do Next.js 16
 *
 * No Next.js 16, params e searchParams são Promises e precisam ser unwrapped
 * antes de serem acessados.
 */

import { use } from "react";

/**
 * Unwraps params de forma segura
 * Use isso em componentes client-side que recebem params como Promise
 */
export function useParams<T extends Record<string, string>>(
	params: Promise<T> | T,
): T {
	if (params instanceof Promise) {
		return use(params);
	}
	return params;
}

/**
 * Unwraps searchParams de forma segura
 * Use isso em componentes client-side que recebem searchParams como Promise
 */
export function useSearchParams(
	searchParams: Promise<URLSearchParams> | URLSearchParams,
): URLSearchParams {
	if (searchParams instanceof Promise) {
		return use(searchParams);
	}
	return searchParams;
}

/**
 * Unwraps params de forma segura em server components
 * Use await em vez de use() em server components
 */
export async function awaitParams<T extends Record<string, string>>(
	params: Promise<T> | T,
): Promise<T> {
	if (params instanceof Promise) {
		return await params;
	}
	return params;
}

/**
 * Unwraps searchParams de forma segura em server components
 * Use await em vez de use() em server components
 */
export async function awaitSearchParams(
	searchParams: Promise<URLSearchParams> | URLSearchParams,
): Promise<URLSearchParams> {
	if (searchParams instanceof Promise) {
		return await searchParams;
	}
	return searchParams;
}
