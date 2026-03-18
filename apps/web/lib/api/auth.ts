import { clearAuthToken } from "@/lib/auth/token-client";
import type { ApiError } from "@/lib/types";
import { apiClient } from "./client";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  userType?: "student" | "gym" | "personal";
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: "STUDENT" | "GYM" | "PERSONAL" | "ADMIN";
  };
  session: {
    id: string;
    token: string;
  };
}

export interface AuthSessionResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: "PENDING" | "STUDENT" | "GYM" | "PERSONAL" | "ADMIN";
    hasGym: boolean;
    hasStudent: boolean;
    activeGymId?: string | null;
    gyms?: Array<{
      id: string;
      plan?: string;
      subscription?: {
        plan: string;
        status: string;
        currentPeriodEnd?: string | Date | null;
      } | null;
    }>;
    student?: {
      id: string;
      subscription?: {
        plan: string;
        status: string;
        currentPeriodEnd?: string | Date | null;
      } | null;
    } | null;
    personal?: {
      id: string;
    } | null;
  };
  session?: {
    id: string;
    token?: string | null;
  } | null;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/api/auth/sign-in",
        credentials,
      );
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      const errorMessage =
        err.response?.data?.error || err.message || "Erro ao fazer login";
      throw new Error(errorMessage);
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        "/api/auth/sign-up",
        data,
      );
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      const errorMessage =
        err.response?.data?.error || err.message || "Erro ao criar conta";
      throw new Error(errorMessage);
    }
  },

  async logout(): Promise<void> {
    try {
      if (typeof window !== "undefined") {
        const { authClient } = await import("@/lib/auth-client");
        await authClient.signOut();
      }

      await apiClient.post("/api/auth/sign-out");
    } catch (error) {
      if (typeof window !== "undefined") {
        clearAuthToken();
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("isAdmin");
      }

      throw error;
    }
  },

  async getSession(): Promise<AuthSessionResponse | null> {
    try {
      const response = await apiClient.get<AuthSessionResponse>(
        "/api/auth/session",
      );
      return response.data;
    } catch {
      return null;
    }
  },

  async exchangeOneTimeToken(token: string): Promise<AuthSessionResponse> {
    try {
      const response = await apiClient.post<AuthSessionResponse>(
        "/api/auth/exchange-one-time-token",
        { token },
      );
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      const errorMessage =
        err.response?.data?.error || err.message || "Erro ao trocar token";
      throw new Error(errorMessage);
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        "/api/auth/forgot-password",
        { email },
      );
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Erro ao solicitar recuperacao de senha";
      throw new Error(errorMessage);
    }
  },

  async verifyResetCode(
    email: string,
    code: string,
  ): Promise<{ valid: boolean; message: string }> {
    try {
      const response = await apiClient.post<{
        valid: boolean;
        message: string;
      }>("/api/auth/verify-reset-code", { email, code });
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      const errorMessage =
        err.response?.data?.error || err.message || "Erro ao verificar codigo";
      throw new Error(errorMessage);
    }
  },

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    try {
      const response = await apiClient.post<{ message: string }>(
        "/api/auth/reset-password",
        { email, code, newPassword },
      );
      return response.data;
    } catch (error) {
      const err = error as ApiError;
      const errorMessage =
        err.response?.data?.error || err.message || "Erro ao redefinir senha";
      throw new Error(errorMessage);
    }
  },
};
