"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/organisms/loading-screen";

export default function Home() {
	const router = useRouter();
	// ⚠️ NÃO usar userRole do store - sempre validar no servidor
	const [mounted, setMounted] = useState(false);

	// Aguardar montagem do componente e rehydrate do Zustand
	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		// Não fazer nada até montar (garantir que Zustand restaurou)
		if (!mounted) return;

		// ⚠️ SEGURANÇA: Validar no servidor, não confiar no localStorage
		// localStorage pode ser modificado pelo usuário
		async function validateAndRedirect() {
			try {
				const { apiClient } = await import("@/lib/api/client");
				const response = await apiClient.get<{
					user: { role: "STUDENT" | "GYM" | "ADMIN" } | null;
				}>("/api/auth/session");

				if (response.data.user) {
					const role = response.data.user.role;

					// Redirecionar baseado no role validado no servidor
					if (role === "STUDENT" || role === "ADMIN") {
						router.push("/student");
						return;
					} else if (role === "GYM") {
						router.push("/gym");
						return;
					}
				}
			} catch (error) {
				// Se falhar, usuário não está autenticado
				console.error("[Home] Erro ao validar sessão:", error);
			}

			// Se chegou aqui, não está autenticado ou não tem role válido
			router.push("/welcome");
		}

		validateAndRedirect();
	}, [router, mounted]);

	return (
		<LoadingScreen.Simple
			variant="student"
			message="Carregando..."
		/>
	);
}
