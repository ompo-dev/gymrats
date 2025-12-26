import { apiClient } from "./client"

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  userType?: "student" | "gym"
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: "STUDENT" | "GYM" | "ADMIN"
  }
  session: {
    id: string
    token: string
  }
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Usar axios client (API → Component)
      const response = await apiClient.post<AuthResponse>(
        "/api/auth/sign-in",
        credentials
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Erro ao fazer login";
      throw new Error(errorMessage);
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Usar axios client (API → Component)
      const response = await apiClient.post<AuthResponse>(
        "/api/auth/sign-up",
        data
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Erro ao criar conta";
      throw new Error(errorMessage);
    }
  },

  async logout(): Promise<void> {
    // Usar axios client (API → Component)
    // O interceptor já adiciona o token automaticamente
    await apiClient.post("/api/auth/sign-out");
  },

  async getSession(): Promise<AuthResponse | null> {
    try {
      // Usar axios client (API → Component)
      // O interceptor já adiciona o token automaticamente
      const response = await apiClient.get<AuthResponse>("/api/auth/session");
      return response.data;
    } catch {
      return null;
    }
  },
}

