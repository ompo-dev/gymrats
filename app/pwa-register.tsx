"use client";

import { useEffect, useRef, useState } from "react";
import { APP_VERSION } from "@/lib/constants/version";

export function PWARegister() {
	const [updateAvailable, setUpdateAvailable] = useState(false);
	const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

	useEffect(() => {
		if (typeof window !== "undefined" && "serviceWorker" in navigator) {
			if (process.env.NODE_ENV === "development") {
				// Em dev, remover SW e caches para evitar conflito com HMR
				const cleanupDev = async () => {
					const regs = await navigator.serviceWorker.getRegistrations();
					await Promise.all(regs.map((reg) => reg.unregister()));

					if ("caches" in window) {
						const keys = await caches.keys();
						await Promise.all(
							keys
								.filter((key) => key.startsWith("gymrats-"))
								.map((key) => caches.delete(key)),
						);
					}
				};

				cleanupDev().catch((error) => {
					console.warn("[PWA] Falha ao limpar SW/caches em dev:", error);
				});
				return;
			}

			let intervalId: NodeJS.Timeout | null = null;

			// Registra o service worker
			const registerSW = async () => {
				try {
					const reg = await navigator.serviceWorker.register("/sw.js", {
						scope: "/",
					});

					console.log("[PWA] Service Worker registrado:", reg.scope);
					console.log("[PWA] Versão da aplicação:", APP_VERSION);

					registrationRef.current = reg;

					// Verifica se há uma atualização disponível
					reg.addEventListener("updatefound", () => {
						const newWorker = reg.installing;
						if (newWorker) {
							newWorker.addEventListener("statechange", () => {
								if (
									newWorker.state === "installed" &&
									navigator.serviceWorker.controller
								) {
									// Novo service worker instalado, mas ainda não ativo
									console.log("[PWA] Nova versão disponível!");
									setUpdateAvailable(true);
								}
							});
						}
					});

					// Verifica atualizações periodicamente (a cada 1 hora)
					intervalId = setInterval(
						() => {
							reg.update();
						},
						60 * 60 * 1000,
					);
				} catch (error) {
					console.error("[PWA] Erro ao registrar Service Worker:", error);
				}
			};

			// Escuta mensagens do service worker
			const handleMessage = (event: MessageEvent) => {
				if (event.data && event.data.type === "SW_UPDATED") {
					console.log(
						"[PWA] Service Worker atualizado para versão:",
						event.data.version,
					);
					// Recarrega a página para aplicar a atualização
					if (confirm("Nova versão disponível! Deseja atualizar agora?")) {
						window.location.reload();
					}
				}
			};

			navigator.serviceWorker.addEventListener("message", handleMessage);

			// Verifica atualizações quando a página ganha foco
			const handleFocus = () => {
				if (registrationRef.current) {
					registrationRef.current.update();
				}
			};

			window.addEventListener("focus", handleFocus);

			// Aguarda o carregamento completo da página
			if (document.readyState === "complete") {
				registerSW();
			} else {
				window.addEventListener("load", registerSW);
			}

			// Cleanup
			return () => {
				if (intervalId) {
					clearInterval(intervalId);
				}
				window.removeEventListener("focus", handleFocus);
				navigator.serviceWorker.removeEventListener("message", handleMessage);
			};
		}
	}, []);

	// Função para atualizar manualmente
	const handleUpdate = async () => {
		if (registrationRef.current) {
			const worker =
				registrationRef.current.waiting || registrationRef.current.installing;
			if (worker) {
				// Envia mensagem para o service worker pular a espera
				worker.postMessage({ type: "SKIP_WAITING" });
				// Recarrega a página após um pequeno delay
				setTimeout(() => {
					window.location.reload();
				}, 100);
			} else {
				// Força atualização se não houver worker esperando
				registrationRef.current.update();
				window.location.reload();
			}
		}
	};

	return (
		<>
			{updateAvailable && (
				<div className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg max-w-sm">
					<p className="text-sm font-medium mb-2">Nova versão disponível!</p>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={handleUpdate}
							className="px-4 py-2 bg-white text-primary rounded text-sm font-medium hover:bg-gray-100 transition-colors"
						>
							Atualizar Agora
						</button>
						<button
							type="button"
							onClick={() => setUpdateAvailable(false)}
							className="px-4 py-2 bg-transparent border border-white/30 rounded text-sm hover:bg-white/10 transition-colors"
						>
							Depois
						</button>
					</div>
				</div>
			)}
		</>
	);
}
