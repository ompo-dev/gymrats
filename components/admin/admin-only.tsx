"use client";

import type { ReactNode } from "react";
import { useUserSession } from "@/hooks/use-user-session";

interface AdminOnlyProps {
	children: ReactNode;
	fallback?: ReactNode;
}

/**
 * Componente que só renderiza children se o usuário for admin
 *
 * ⚠️ SEGURANÇA: Este componente valida no servidor via useUserSession.
 * No entanto, componentes de UI podem ser contornados - sempre valide no servidor também!
 *
 * @example
 * <AdminOnly>
 *   <TestComponent />
 * </AdminOnly>
 *
 * @example
 * <AdminOnly fallback={<p>Acesso negado</p>}>
 *   <TestComponent />
 * </AdminOnly>
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
	// ✅ SEGURO: Validar no servidor via useUserSession
	const { isAdmin, role, isLoading } = useUserSession();

	// Verificar se é admin (validado no servidor)
	const userIsAdmin = isAdmin || role === "ADMIN";

	// Mostrar fallback enquanto carrega ou se não for admin
	if (isLoading) {
		return <>{fallback}</>;
	}

	if (!userIsAdmin) {
		return <>{fallback}</>;
	}

	return <>{children}</>;
}
