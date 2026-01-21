import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
// Para API routes do Next.js (autenticação)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // NÃO definir timeout aqui - será definido por chamada ou usar padrão do axios
    this.client = axios.create({
      baseURL: API_BASE_URL,
      // timeout removido do construtor - será definido por chamada específica
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
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
      }
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
          
          const isSilentRoute = silent500Routes.some((route) => url.includes(route));
          
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
          
          const isSilentRoute = silent404Routes.some((route) => url.includes(route));
          if (isSilentRoute) {
            error._isHandled = true;
            error._isSilent = true;
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    // Timeout padrão de 30s se não especificado, mas pode ser sobrescrito no config
    // IMPORTANTE: config vem DEPOIS para sobrescrever o timeout padrão
    const finalConfig: AxiosRequestConfig = {
      timeout: 30000, // Padrão de 30s
      ...config, // Config passado sobrescreve (incluindo timeout se especificado)
    };

    return this.client.post<T>(url, data, finalConfig);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
