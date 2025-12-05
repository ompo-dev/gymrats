"use client"

import { useState } from "react"
import { DuoButton } from "@/components/ui/duo-button"
import { Users, Building2, Dumbbell, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import { useAuthStore } from "@/stores"

export default function UserTypePage() {
  const router = useRouter()
  const { setUserMode, userId, setAuthenticated } = useAuthStore()
  const [selectedType, setSelectedType] = useState<"student" | "gym" | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectType = async (type: "student" | "gym") => {
    setSelectedType(type)
    setIsLoading(true)
    
    try {
      // Atualizar role no banco de dados
      const currentUserId = userId || localStorage.getItem("userId")
      
      if (currentUserId) {
        const response = await fetch("/api/users/update-role", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUserId,
            userType: type,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro ao atualizar tipo de usuário")
        }
      }

      // Atualizar store e localStorage
      setUserMode(type)
      setAuthenticated(true)
      localStorage.setItem("userMode", type)
      localStorage.setItem("isAuthenticated", "true")

      // Redirecionar direto para o app (sem delay)
      if (type === "student") {
        router.push("/student")
      } else {
        router.push("/gym")
      }
    } catch (error: any) {
      console.error("Erro ao selecionar tipo:", error)
      alert(error.message || "Erro ao selecionar tipo de usuário. Tente novamente.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-12 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
              className="flex justify-center mb-4"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#58CC02] to-[#47A302] rounded-3xl flex items-center justify-center shadow-lg">
                <Dumbbell className="w-10 h-10 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Como você vai usar o GymRats?
            </h1>
            <p className="text-gray-600 text-lg">
              Escolha a opção que melhor descreve você
            </p>
          </motion.div>

          {/* Type Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Type */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectType("student")}
                disabled={isLoading}
                className={`w-full p-8 rounded-3xl border-2 transition-all text-left ${
                  selectedType === "student"
                    ? "border-[#58CC02] bg-[#58CC02]/5 shadow-xl"
                    : "border-gray-200 bg-white hover:border-[#58CC02]/50 hover:shadow-lg"
                }`}
              >
                <div className="text-center mb-6">
                  <motion.div
                    className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      selectedType === "student"
                        ? "bg-gradient-to-br from-[#58CC02] to-[#47A302]"
                        : "bg-gray-100"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Users
                      className={`w-12 h-12 ${
                        selectedType === "student" ? "text-white" : "text-gray-400"
                      }`}
                    />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Sou Aluno</h2>
                  <p className="text-gray-600 text-sm">
                    Acompanhe treinos, dieta e progresso
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  {[
                    "Sistema de gamificação",
                    "Treinos personalizados",
                    "Análise de postura com IA",
                    "Competição com amigos",
                  ].map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          selectedType === "student" ? "bg-[#58CC02]" : "bg-gray-300"
                        }`}
                      />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedType === "student" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center gap-2 text-[#58CC02] font-bold"
                    >
                      <Check className="w-5 h-5" />
                      <span>Selecionado</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>

            {/* Gym Type */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectType("gym")}
                disabled={isLoading}
                className={`w-full p-8 rounded-3xl border-2 transition-all text-left ${
                  selectedType === "gym"
                    ? "border-[#FF9600] bg-[#FF9600]/5 shadow-xl"
                    : "border-gray-200 bg-white hover:border-[#FF9600]/50 hover:shadow-lg"
                }`}
              >
                <div className="text-center mb-6">
                  <motion.div
                    className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      selectedType === "gym"
                        ? "bg-gradient-to-br from-[#FF9600] to-[#E68A00]"
                        : "bg-gray-100"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Building2
                      className={`w-12 h-12 ${
                        selectedType === "gym" ? "text-white" : "text-gray-400"
                      }`}
                    />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Sou Academia</h2>
                  <p className="text-gray-600 text-sm">
                    Gerencie alunos e equipamentos
                  </p>
                </div>

                <div className="space-y-2 mb-6">
                  {[
                    "Gestão completa de alunos",
                    "Controle de equipamentos",
                    "Gestão financeira",
                    "Gamificação para academias",
                  ].map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          selectedType === "gym" ? "bg-[#FF9600]" : "bg-gray-300"
                        }`}
                      />
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>

                <AnimatePresence>
                  {selectedType === "gym" && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center justify-center gap-2 text-[#FF9600] font-bold"
                    >
                      <Check className="w-5 h-5" />
                      <span>Selecionado</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-gray-500 mt-8 text-sm"
          >
            Você poderá mudar entre os modos a qualquer momento
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}
