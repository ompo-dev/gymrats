"use client";

import { useEffect, useRef, useState } from "react";

declare global {
	interface Window {
		// biome-ignore lint/suspicious/noExplicitAny: Swagger UI carregado via script externo
		SwaggerUIBundle?: any;
		// biome-ignore lint/suspicious/noExplicitAny: Swagger UI carregado via script externo
		SwaggerUIStandalonePreset?: any;
	}
}

export default function ApiDocsPage() {
	const swaggerRef = useRef<HTMLDivElement>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (typeof window === "undefined" || !swaggerRef.current) return;

		const initSwagger = () => {
			const SwaggerUIBundle = window.SwaggerUIBundle;
			const SwaggerUIStandalonePreset = window.SwaggerUIStandalonePreset;

			if (SwaggerUIBundle && SwaggerUIStandalonePreset && swaggerRef.current) {
				swaggerRef.current.innerHTML = "";

				SwaggerUIBundle({
					url: "/api/swagger",
					dom_id: "#swagger-ui",
					presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
					layout: "StandaloneLayout",
					deepLinking: true,
					displayRequestDuration: true,
					filter: true,
					tryItOutEnabled: true,
					persistAuthorization: true,
					supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
					requestInterceptor: (req: {
						headers?: Record<string, string>;
						credentials?: string;
					}) => {
						// Tentar pegar token do cookie primeiro
						const cookies = document.cookie.split(";");
						let token: string | null = null;
						for (const cookie of cookies) {
							const [name, value] = cookie.trim().split("=");
							if (name === "auth_token") {
								token = value;
								break;
							}
						}

						// Se não encontrou no cookie, tentar localStorage
						if (!token) {
							token = localStorage.getItem("auth_token");
						}

						if (token && req.headers) {
							req.headers.Authorization = `Bearer ${token}`;
						}

						// Garantir que cookies sejam enviados
						req.credentials = "include";

						return req;
					},
					responseInterceptor: (res: unknown) => {
						// Log de respostas para debug
						console.log("[Swagger] Response:", res);
						return res;
					},
				});

				setLoading(false);
			}
		};

		const cssLink = document.createElement("link");
		cssLink.rel = "stylesheet";
		cssLink.href = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css";
		document.head.appendChild(cssLink);

		const bundleScript = document.createElement("script");
		bundleScript.src =
			"https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js";
		bundleScript.async = true;

		const presetScript = document.createElement("script");
		presetScript.src =
			"https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js";
		presetScript.async = true;

		bundleScript.onload = () => {
			document.body.appendChild(presetScript);

			presetScript.onload = () => {
				setTimeout(initSwagger, 100);
			};
		};

		document.body.appendChild(bundleScript);
	}, []);

	return (
		<div className="min-h-screen bg-white">
			<div className="container mx-auto p-4 md:p-8">
				<div className="mb-6">
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
						📚 API Documentation
					</h1>
					<p className="text-gray-600 text-sm md:text-base">
						Documentação completa da API do Fitness App. Teste todas as rotas de
						autenticação e gerenciamento de usuários.
					</p>
					<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-sm text-blue-800">
							<strong>💡 Dica:</strong> Após fazer login, copie o token e clique
							em &quot;Authorize&quot; no topo para autenticar nas rotas
							protegidas.
						</p>
					</div>
				</div>

				{loading && (
					<div className="flex items-center justify-center h-96">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#58CC02] mx-auto mb-4"></div>
							<p className="text-gray-600">Carregando documentação...</p>
						</div>
					</div>
				)}

				<div
					id="swagger-ui"
					ref={swaggerRef}
					style={{ minHeight: "800px" }}
				></div>
			</div>
		</div>
	);
}
