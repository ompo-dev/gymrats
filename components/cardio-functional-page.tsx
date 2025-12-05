"use client"

import { useState } from "react"
import { CardioTracker } from "./cardio-tracker"
import { FunctionalWorkout } from "./functional-workout"
import { Heart, Target, TrendingUp } from "lucide-react"

export function CardioFunctionalPage() {
  const [view, setView] = useState<"menu" | "cardio" | "functional">("menu")

  if (view === "cardio") {
    return (
      <div>
        <button
          onClick={() => setView("menu")}
          className="mb-4 flex items-center gap-2 font-bold text-duo-red hover:underline"
        >
          ← Voltar
        </button>
        <CardioTracker />
      </div>
    )
  }

  if (view === "functional") {
    return (
      <div>
        <button
          onClick={() => setView("menu")}
          className="mb-4 flex items-center gap-2 font-bold text-duo-blue hover:underline"
        >
          ← Voltar
        </button>
        <FunctionalWorkout />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Cardio e Funcionais</h1>
        <p className="text-sm text-duo-gray-dark">Melhore sua saúde cardiovascular e funcionalidade</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border-2 border-duo-red bg-gradient-to-br from-duo-red/10 to-duo-orange/10 p-4 text-center">
          <Heart className="mx-auto mb-2 h-10 w-10 fill-duo-red/20 text-duo-red" />
          <div className="mb-1 text-2xl font-bold text-duo-text">3x</div>
          <div className="text-xs font-bold text-duo-gray-dark">cardio esta semana</div>
        </div>

        <div className="rounded-2xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-duo-green/10 p-4 text-center">
          <TrendingUp className="mx-auto mb-2 h-10 w-10 text-duo-blue" />
          <div className="mb-1 text-2xl font-bold text-duo-text">850</div>
          <div className="text-xs font-bold text-duo-gray-dark">kcal queimadas</div>
        </div>
      </div>

      {/* Main Options */}
      <div className="grid gap-4">
        <button
          onClick={() => setView("cardio")}
          className="rounded-2xl border-2 border-duo-red bg-gradient-to-br from-duo-red/10 to-duo-orange/10 p-6 text-left transition-all hover:shadow-lg active:scale-[0.98]"
        >
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-red text-4xl shadow-lg">
            🏃
          </div>
          <h3 className="mb-2 text-xl font-bold text-duo-text">Treino Cardio</h3>
          <p className="mb-3 text-sm text-duo-gray-dark">
            Corrida, ciclismo, natação, remo e mais modalidades com tracking de calorias
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-duo-red/20 px-3 py-1 text-xs font-bold text-duo-red">8 modalidades</span>
            <span className="rounded-full bg-duo-orange/20 px-3 py-1 text-xs font-bold text-duo-orange">
              Monitor de FC
            </span>
            <span className="rounded-full bg-duo-yellow/20 px-3 py-1 text-xs font-bold text-duo-text">
              Calorias em tempo real
            </span>
          </div>
        </button>

        <button
          onClick={() => setView("functional")}
          className="rounded-2xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-duo-green/10 p-6 text-left transition-all hover:shadow-lg active:scale-[0.98]"
        >
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-duo-blue text-4xl shadow-lg">
            🤸
          </div>
          <h3 className="mb-2 text-xl font-bold text-duo-text">Treino Funcional</h3>
          <p className="mb-3 text-sm text-duo-gray-dark">
            Exercícios para todas as idades: crianças, adultos e terceira idade
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-duo-green/20 px-3 py-1 text-xs font-bold text-duo-green">Mobilidade</span>
            <span className="rounded-full bg-duo-blue/20 px-3 py-1 text-xs font-bold text-duo-blue">Equilíbrio</span>
            <span className="rounded-full bg-duo-orange/20 px-3 py-1 text-xs font-bold text-duo-orange">
              Coordenação
            </span>
          </div>
        </button>

        {/* Educational callout */}
        <div className="rounded-2xl border-2 border-duo-yellow bg-gradient-to-br from-duo-yellow/10 to-duo-orange/10 p-4">
          <div className="flex items-start gap-3">
            <Target className="mt-1 h-6 w-6 flex-shrink-0 text-duo-orange" />
            <div>
              <h4 className="mb-1 font-bold text-duo-text">Cálculo Personalizado</h4>
              <p className="text-xs text-duo-gray-dark">
                As calorias são calculadas baseadas no seu peso, idade, gênero e perfil hormonal para máxima precisão
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
