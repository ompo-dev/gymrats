"use client"

import type React from "react"
import { useState } from "react"
import { DuoButton } from "@/components/ui/duo-button"
import { Input } from "@/components/ui/input"
import { Dumbbell, Mail, Lock, User, Chrome, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { useAuthStore } from "@/stores"
import { authApi } from "@/lib/api/auth"

export default function RegisterPage() {
  const router = useRouter()
  const { setAuthenticated, setUserProfile, setUserId, setUserMode } = useAuthStore()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas não coincidem!")
      return
    }

    if (password.length < 8) {
      setError("A senha deve ter no mínimo 8 caracteres")
      return
    }

    setIsLoading(true)

    try {
      const response = await authApi.register({
        name,
        email,
        password,
      })

      // Salvar token e dados
      localStorage.setItem("auth_token", response.session.token)
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userEmail", email)
      localStorage.setItem("userName", name)
      localStorage.setItem("userId", response.user.id)

      // Atualizar store
      setAuthenticated(true)
      setUserId(response.user.id)
      setUserMode(null) // Ainda não tem tipo definido
      setUserProfile({
        id: response.user.id,
        name: response.user.name,
        age: 25,
        gender: "prefer-not-to-say",
        height: 170,
        weight: 70,
        fitnessLevel: "iniciante",
        weeklyWorkoutFrequency: 3,
        workoutDuration: 60,
        goals: [],
        availableEquipment: [],
        gymType: "academia-completa",
        preferredWorkoutTime: "manha",
        preferredSets: 3,
        preferredRepRange: "hipertrofia",
        restTime: "medio",
      })

      // Manter usuário logado e ir para seleção de tipo
      router.push("/auth/register/user-type")
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = () => {
    setIsLoading(true)
    setError("")
    // TODO: Implementar registro com Google usando Better Auth
    alert("Registro com Google será implementado em breve")
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 flex-shrink-0">
          <Link href="/welcome">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Voltar</span>
            </motion.button>
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-8 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
              className="flex justify-center mb-4"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#58CC02] to-[#47A302] rounded-3xl flex items-center justify-center shadow-lg">
                <Dumbbell className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Criar conta</h1>
            <p className="text-gray-600">Comece sua jornada fitness hoje</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          {/* Google Register */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <DuoButton
              variant="outline"
              size="lg"
              className="w-full mb-4"
              onClick={handleGoogleRegister}
              disabled={isLoading}
              animation="scale"
            >
              <Chrome className="w-5 h-5" />
              Continuar com Google
            </DuoButton>
          </motion.div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-gray-500 font-medium">OU</span>
            </div>
          </div>

          {/* Register Form */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleRegister}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 border-2 text-base rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-2 text-base rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 border-2 text-base rounded-xl"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12 border-2 text-base rounded-xl"
                  required
                />
              </div>
            </div>

            <DuoButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              loading={isLoading}
              animation="scale"
            >
              Criar conta
            </DuoButton>
          </motion.form>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-600 text-sm">
              Já tem uma conta?{" "}
              <Link href="/auth/login" className="text-[#58CC02] hover:underline font-bold">
                Entrar
              </Link>
            </p>
          </motion.div>

          <p className="text-xs text-gray-500 text-center mt-6">
            Ao criar uma conta, você concorda com nossos{" "}
            <Link href="/terms" className="text-[#58CC02] hover:underline">
              Termos de Uso
            </Link>{" "}
            e{" "}
            <Link href="/privacy" className="text-[#58CC02] hover:underline">
              Política de Privacidade
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

