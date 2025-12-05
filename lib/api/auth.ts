import { apiClient } from "./client"

// Base URL para API routes do Next.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"

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
    userType?: "student" | "gym"
  }
  session: {
    id: string
    token: string
  }
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/sign-in`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Erro ao fazer login")
    }

    return response.json()
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/sign-up`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Erro ao criar conta")
    }

    return response.json()
  },

  async logout(): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
    if (!token) return

    await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
  },

  async getSession(): Promise<AuthResponse | null> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      if (!token) return null

      const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return null
      }

      return response.json()
    } catch {
      return null
    }
  },
}

