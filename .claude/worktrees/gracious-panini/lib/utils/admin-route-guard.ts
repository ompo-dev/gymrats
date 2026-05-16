"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUserSession } from "@/hooks/use-user-session";

/**
 * Hook para proteger rotas que só admin pode acessar
 *
 * ⚠️ SEGURANÇA: Este hook valida no servidor via useUserSession.
 * No entanto, proteção de rotas no cliente pode ser contornada - sempre valide no servidor também!
 *
 * @param allowed - Se true, permite acesso. Se false, bloqueia se não for admin
 * @param redirectTo - Rota para redirecionar se não for admin (padrão: /student)
 *
 * @example
 * // Bloquear rota se não for admin
 * useAdminRouteGuard(false, "/student");
 *
 * @example
 * // Permitir acesso (não bloqueia)
 * useAdminRouteGuard(true);
 */
export function useAdminRouteGuard(
	allowed: boolean = false,
	redirectTo: string = "/student",
) {
	const router = useRouter();
	const pathname = usePathname();

	// ✅ SEGURO: Validar no servidor via useUserSession
	const { isAdmin, role, isLoading } = useUserSession();

	useEffect(() => {
		// Se allowed é true, não bloqueia
		if (allowed) return;

		// Aguardar carregamento da sessão
		if (isLoading) return;

		// Verificar se é admin (validado no servidor)
		const userIsAdmin = isAdmin || role === "ADMIN";

		// Se não for admin, redirecionar
		if (!userIsAdmin) {
			console.warn(
				`[AdminRouteGuard] Acesso negado a ${pathname}. Redirecionando para ${redirectTo}`,
			);
			router.push(redirectTo);
		}
	}, [allowed, isAdmin, role, isLoading, pathname, router, redirectTo]);

	// Retornar se tem acesso
	const userIsAdmin = isAdmin || role === "ADMIN";
	return allowed || userIsAdmin;
}

/**
 * Verifica se uma rota deve ser bloqueada baseado em search params
 *
 * @param searchParams - Search params da URL
 * @param isAdmin - Se o usuário é admin
 * @returns true se a rota deve ser bloqueada
 */
export function shouldBlockRoute(
	searchParams: Record<string, string | string[] | undefined>,
	isAdmin: boolean,
): boolean {
	// Se for admin, nunca bloqueia
	if (isAdmin) return false;

	// Rotas bloqueadas para não-admin (usando search params)
	const blockedTabs = ["cardio", "gyms", "payments"];
	const tab = searchParams.tab as string | undefined;

	// Bloquear se tab estiver na lista de bloqueados
	if (tab && blockedTabs.includes(tab)) {
		return true;
	}

	return false;
}
