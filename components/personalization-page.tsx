"use client"

import { useState } from "react"
import { AIWorkoutGenerator } from "./ai-workout-generator"
import { AIDietGenerator } from "./ai-diet-generator"
import { Dumbbell, UtensilsCrossed } from "lucide-react"

export function PersonalizationPage() {
  const [activeView, setActiveView] = useState<"menu" | "workout" | "diet">("menu")

  if (activeView === "workout") {
    return (
      <div>
        <button
          onClick={() => setActiveView("menu")}
          className="mb-4 flex items-center gap-2 font-bold text-duo-blue hover:underline"
        >
          ← Voltar
        </button>
        <AIWorkoutGenerator />
      </div>
    )
  }

  if (activeView === "diet") {
    return (
      <div>
        <button
          onClick={() => setActiveView("menu")}
          className="mb-4 flex items-center gap-2 font-bold text-duo-green hover:underline"
        >
          ← Voltar
        </button>
        <AIDietGenerator />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Personalização com IA</h1>
        <p className="text-sm text-duo-gray-dark">Crie treinos e dietas personalizados instantaneamente</p>
      </div>

      <div className="grid gap-4">
        <button
          onClick={() => setActiveView("workout")}
          className="rounded-2xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-duo-green/10 p-6 text-left transition-all hover:shadow-lg"
        >
          <Dumbbell className="mb-3 h-12 w-12 text-duo-blue" />
          <h3 className="mb-2 text-xl font-bold text-duo-text">Gerar Treino com IA</h3>
          <p className="text-sm text-duo-gray-dark">
            Crie treinos personalizados baseados em suas preferências e objetivos
          </p>
        </button>

        <button
          onClick={() => setActiveView("diet")}
          className="rounded-2xl border-2 border-duo-green bg-gradient-to-br from-duo-green/10 to-duo-yellow/10 p-6 text-left transition-all hover:shadow-lg"
        >
          <UtensilsCrossed className="mb-3 h-12 w-12 text-duo-green" />
          <h3 className="mb-2 text-xl font-bold text-duo-text">Gerar Dieta com IA</h3>
          <p className="text-sm text-duo-gray-dark">Crie planos alimentares ajustados aos seus macros e restrições</p>
        </button>
      </div>

      <div className="rounded-2xl border-2 border-duo-yellow bg-duo-yellow/10 p-6">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-duo-text">
          <span>✨</span>
          Tecnologia de IA
        </h3>
        <ul className="space-y-2 text-sm text-duo-gray-dark">
          <li className="flex items-start gap-2">
            <span className="text-duo-green">•</span>
            <span>Treinos adaptados ao seu nível e equipamentos disponíveis</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-duo-green">•</span>
            <span>Dietas balanceadas respeitando suas restrições alimentares</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-duo-green">•</span>
            <span>Ajustes automáticos baseados no seu progresso</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-duo-green">•</span>
            <span>Sugestões personalizadas para otimizar resultados</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
