"use client"

import { DuoButton } from "@/components/ui/duo-button"
import { motion } from "motion/react"
import Link from "next/link"
import { Dumbbell } from "lucide-react"

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Illustration Section */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Mascot Illustration Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="relative">
              {/* Main mascot/icon */}
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                  className="w-32 h-32 bg-gradient-to-br from-[#58CC02] to-[#47A302] rounded-3xl flex items-center justify-center shadow-xl"
                >
                  <Dumbbell className="w-16 h-16 text-white" />
                </motion.div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-full opacity-20 blur-xl" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#58CC02] rounded-full opacity-20 blur-xl" />
            </div>
          </motion.div>

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              A forma gratuita, divertida e
              <br />
              eficaz de aprender musculação!
            </h1>
            <p className="text-base text-gray-600 max-w-sm mx-auto">
              Transforme seu treino em uma jornada gamificada. Aprenda técnicas, evolua e conquiste seus objetivos.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="space-y-4"
          >
            <Link href="/auth/register" className="block">
              <DuoButton
                variant="primary"
                size="lg"
                className="w-full"
                animation="scale"
              >
                Começar agora
              </DuoButton>
            </Link>

            <Link href="/auth/login" className="block">
              <DuoButton
                variant="ghost"
                size="lg"
                className="w-full border-2 border-gray-300"
                animation="scale"
              >
                Já tenho uma conta
              </DuoButton>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        className="pb-8 px-4 text-center"
      >
        <p className="text-sm text-gray-500">
          Ao continuar, você concorda com nossos{" "}
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
  )
}
