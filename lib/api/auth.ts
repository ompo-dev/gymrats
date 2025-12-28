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

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        "/api/auth/forgot-password",
        { email }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Erro ao solicitar recuperação de senha";
      throw new Error(errorMessage);
    }
  },

  async verifyResetCode(email: string, code: string): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await apiClient.post<{ valid: boolean; message: string }>(
        "/api/auth/verify-reset-code",
        { email, code }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Erro ao verificar código";
      throw new Error(errorMessage);
    }
  },

  async resetPassword(email: string, code: string, newPassword: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        "/api/auth/reset-password",
        { email, code, newPassword }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Erro ao redefinir senha";
      throw new Error(errorMessage);
    }
  },
}

