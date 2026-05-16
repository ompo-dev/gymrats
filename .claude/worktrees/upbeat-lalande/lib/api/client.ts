import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type AxiosResponse,
} from "axios";

// Para API routes do Next.js (autenticação)
// No browser, sempre use mesma origem para evitar drift de porta/host.
// No server-side, use a env configurada.
const API_BASE_URL =
	typeof window !== "undefined"
		? ""
		: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

class ApiClient {
	private client: AxiosInstance;

	constructor() {
		// No browser, sempre usar URL relativa (mesma origem)
		// No server-side, usar a env configurada
		const finalBaseURL =
			typeof window !== "undefined"
				? ""
				: API_BASE_URL || "http://localhost:3000";

		// NÃO definir timeout aqui - será definido por chamada ou usar padrão do axios
		this.client = axios.create({
			baseURL: finalBaseURL,
			// timeout removido do construtor - será definido por chamada específica
			headers: {
				"Content-Type": "application/json",
			},
		});

		// Request interceptor
		this.client.interceptors.request.use(
			(config) => {
				// No browser, garantir que baseURL seja sempre relativo (mesma origem)
				if (typeof window !== "undefined") {
					// Se baseURL estiver definido e for uma URL absoluta, forçar para string vazia
					if (
						config.baseURL &&
						(config.baseURL.startsWith("http://") ||
							config.baseURL.startsWith("https://"))
					) {
						// Verificar se não é localhost:3000 (porta correta)
						if (!config.baseURL.includes(":3000")) {
							console.warn(
								`[apiClient] baseURL incorreto detectado: ${config.baseURL}. Forçando para mesma origem.`,
							);
							config.baseURL = "";
						}
					} else if (!config.baseURL) {
						config.baseURL = "";
					}

					// Garantir que URLs absolutas com porta errada sejam corrigidas
					if (config.url?.startsWith("http://localhost:3000")) {
						console.warn(
							`[apiClient] URL com porta 3000 detectada: ${config.url}. Corrigindo para mesma origem.`,
						);
						config.url = config.url.replace("http://localhost:3000", "");
					}
				}

				// Adicionar token se existir
				const token =
					typeof window !== "undefined"
						? localStorage.getItem("auth_token")
						: null;
				if (token) {
					config.headers.Authorization = `Bearer ${token}`;
				}
				return config;
			},
			(error) => {
				return Promise.reject(error);
			},
		);

		// Response interceptor
		this.client.interceptors.response.use(
			(response) => {
				return response;
			},
			(error) => {
				const status = error?.response?.status;
				const url = error?.config?.url;

				// Tratar erros de autenticação
				if (status === 401) {
					if (typeof window !== "undefined") {
						localStorage.removeItem("auth_token");
						window.location.href = "/welcome";
					}
				}

				// Para erros 500 em rotas de carregamento de seções, marcar como tratado
				// Esses erros são tratados silenciosamente no loadSection
				// Isso evita que apareçam como erros críticos no console
				if (status === 500 && url && typeof url === "string") {
					// Rotas que podem retornar 500 e são tratadas silenciosamente
					const silent500Routes = [
						"/api/students/",
						"/api/workouts/",
						"/api/nutrition/",
						"/api/subscriptions/",
						"/api/memberships",
						"/api/payments",
						"/api/payment-methods",
						"/api/gyms/",
					];

					const isSilentRoute = silent500Routes.some((route) =>
						url.includes(route),
					);

					if (isSilentRoute) {
						// Marcar erro como tratado silenciosamente
						// Isso permite que o loadSection trate o erro sem logs duplicados
						error._isHandled = true;
						error._isSilent = true; // Flag adicional para indicar que é silencioso
					}
				}

				// Para erros 404 também marcar como tratado silenciosamente
				if (status === 404 && url && typeof url === "string") {
					const silent404Routes = [
						"/api/students/",
						"/api/workouts/",
						"/api/nutrition/",
					];

					const isSilentRoute = silent404Routes.some((route) =>
						url.includes(route),
					);
					if (isSilentRoute) {
						error._isHandled = true;
						error._isSilent = true;
					}
				}

				return Promise.reject(error);
			},
		);
	}

	async get<T = unknown>(
		url: string,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> {
		return this.client.get<T>(url, config);
	}

	async post<T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> {
		// Timeout padrão de 30s se não especificado, mas pode ser sobrescrito no config
		// IMPORTANTE: config vem DEPOIS para sobrescrever o timeout padrão
		const finalConfig: AxiosRequestConfig = {
			timeout: 30000, // Padrão de 30s
			...config, // Config passado sobrescreve (incluindo timeout se especificado)
		};

		return this.client.post<T>(url, data, finalConfig);
	}

	async put<T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> {
		return this.client.put<T>(url, data, config);
	}

	async patch<T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> {
		return this.client.patch<T>(url, data, config);
	}

	async delete<T = unknown>(
		url: string,
		config?: AxiosRequestConfig,
	): Promise<AxiosResponse<T>> {
		return this.client.delete<T>(url, config);
	}
}

export const apiClient = new ApiClient();
