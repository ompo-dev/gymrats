"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { authClient } from "@/lib/auth-client";
import { isStandaloneMode } from "@/lib/utils/pwa-detection";

/**
 * Página de callback do OAuth
 *
 * Esta página processa o callback do Google OAuth e:
 * - Se estiver em PWA e aberta em popup: comunica com a janela pai via postMessage
 * - Se estiver em navegador normal: redireciona normalmente
 */
function AuthCallbackPageContent() {
	const searchParams = useSearchParams();
	const [status, setStatus] = useState<"processing" | "success" | "error">(
		"processing",
	);
	const [error, setError] = useState<string>("");

	// Detectar se foi aberta em popup (PWA) - window.opener não é null quando aberta via window.open()
	// IMPORTANTE: window.opener pode ser perdido após redirects, então também verificamos sessionStorage
	const [isInPopup] = useState(() => {
		if (typeof window === "undefined") return false;
		// Verificar window.opener primeiro (mais confiável)
		if (window.opener !== null && window.opener !== window) {
			return true;
		}
		// Fallback: verificar sessionStorage (setado antes de abrir popup)
		return sessionStorage.getItem("pwa_oauth_popup") === "true";
	});
	const _isPWA = typeof window !== "undefined" ? isStandaloneMode() : false;

	// Limpar flag do sessionStorage após detectar
	useEffect(() => {
		if (isInPopup && typeof window !== "undefined") {
			sessionStorage.removeItem("pwa_oauth_popup");
		}
	}, [isInPopup]);

	useEffect(() => {
		const processCallback = async () => {
			try {
				// Verificar se há erro na URL
				const errorParam = searchParams.get("error");
				if (errorParam) {
					throw new Error("Erro durante autenticação. Tente novamente.");
				}

				// Aguardar um pouco para o Better Auth processar o callback
				// O Better Auth processa o callback via `/api/auth/callback/google`
				// e então redireciona para esta página (/auth/callback)
				// Aguardar mais tempo para garantir que o Better Auth terminou de processar
				await new Promise((resolve) => setTimeout(resolve, 1500));

				// Buscar sessão do Better Auth diretamente
				const { data: session } = await authClient.getSession();

				if (!session?.user) {
					// Tentar buscar via API também (fallback)
					const sessionResponse = await authApi.getSession();
					if (!sessionResponse?.user) {
						// Se ainda não tem sessão, aguardar mais um pouco
						await new Promise((resolve) => setTimeout(resolve, 1000));
						const { data: retrySession } = await authClient.getSession();
						if (!retrySession?.user) {
							throw new Error(
								"Sessão não encontrada após login. Por favor, tente novamente.",
							);
						}
						// Processar com retrySession
						const sessionResponse2 = await authApi.getSession();
						if (!sessionResponse2?.user) {
							throw new Error("Erro ao buscar dados da sessão");
						}
						processSuccess(sessionResponse2);
						return;
					}
					processSuccess(sessionResponse);
					return;
				}

				// Buscar dados completos via nossa API de session
				const sessionResponse = await authApi.getSession();

				if (!sessionResponse) {
					throw new Error("Erro ao buscar dados da sessão");
				}

				processSuccess(sessionResponse);
			} catch (err: unknown) {
				console.error("Erro ao processar callback:", err);
				const msg =
					err instanceof Error ? err.message : "Erro ao processar login";
				setError(msg);

				// Se está em popup, enviar mensagem de erro
				if (isInPopup && window.opener) {
					window.opener.postMessage(
						{
							type: "OAUTH_ERROR",
							error: msg,
						},
						window.location.origin,
					);

					setTimeout(() => {
						window.close();
					}, 2000);
				} else {
					// Se não está em popup, redirecionar para welcome com erro
					setTimeout(() => {
						window.location.href = "/welcome?error=google";
					}, 2000);
				}

				setStatus("error");
			}
		};

		const processSuccess = (sessionResponse: {
			user: {
				id: string;
				email?: string | null;
				name?: string | null;
				role?: string;
			};
			session?: { token?: string };
		}) => {
			const userRole =
				(sessionResponse.user as { role: "STUDENT" | "GYM" | "ADMIN" }).role ||
				sessionResponse.user.role;

			// Se está em popup (PWA), comunicar com janela pai
			if (isInPopup && window.opener) {
				// Enviar mensagem para a janela pai (PWA)
				window.opener.postMessage(
					{
						type: "OAUTH_SUCCESS",
						user: {
							id: sessionResponse.user.id,
							email: sessionResponse.user.email,
							name: sessionResponse.user.name,
							role: userRole,
						},
						session: {
							token: sessionResponse.session?.token,
						},
					},
					window.location.origin,
				);

				setStatus("success");

				// Fechar a popup após um pequeno delay
				setTimeout(() => {
					window.close();
				}, 1000);
			} else {
				// Navegador normal - redirecionar normalmente
				const redirectURL = userRole === "GYM" ? "/gym" : "/student";
				window.location.href = redirectURL;
			}
		};

		processCallback();
	}, [searchParams, isInPopup]);

	return (
		<div className="min-h-screen bg-white flex items-center justify-center">
			<div className="text-center">
				{status === "processing" && (
					<>
						<div className="w-20 h-20 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
						<p className="text-gray-600">Processando login...</p>
					</>
				)}
				{status === "success" && (
					<>
						<div className="w-20 h-20 bg-[#58CC02] rounded-full flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-12 h-12 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								role="img"
								aria-label="Sucesso"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<p className="text-gray-600">Login realizado com sucesso!</p>
						{isInPopup && (
							<p className="text-sm text-gray-500 mt-2">
								Esta janela será fechada automaticamente...
							</p>
						)}
					</>
				)}
				{status === "error" && (
					<>
						<div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-12 h-12 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								role="img"
								aria-label="Erro"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</div>
						<p className="text-red-600 font-bold mb-2">Erro ao fazer login</p>
						<p className="text-sm text-gray-600">{error}</p>
						{isInPopup && (
							<p className="text-sm text-gray-500 mt-2">
								Esta janela será fechada automaticamente...
							</p>
						)}
					</>
				)}
			</div>
		</div>
	);
}

/**
 * Wrapper com Suspense para useSearchParams
 */
export default function AuthCallbackPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-white flex items-center justify-center">
					<div className="text-center">
						<div className="w-20 h-20 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
						<p className="text-gray-600">Carregando...</p>
					</div>
				</div>
			}
		>
			<AuthCallbackPageContent />
		</Suspense>
	);
}
