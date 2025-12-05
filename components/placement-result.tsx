"use client"

import type { PlacementTestResult } from "@/lib/types"
import { Trophy, Target, Calendar, Flame } from "lucide-react"

interface PlacementResultProps {
  result: PlacementTestResult
  onStart: () => void
}

export function PlacementResult({ result, onStart }: PlacementResultProps) {
  const levelLabels = {
    iniciante: "Iniciante",
    intermediario: "Intermediário",
    avancado: "Avançado",
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-duo-green/5 to-white">
      <div className="container px-4 py-12">
        <div className="mx-auto max-w-2xl text-center">
          {/* Trophy animation */}
          <div className="mb-8 animate-bounce-slow">
            <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-duo-yellow to-duo-orange text-7xl shadow-lg">
              <Trophy className="h-20 w-20 text-white" />
            </div>
          </div>

          <h1 className="mb-4 text-4xl font-bold text-duo-text">Resultado do Teste!</h1>
          <p className="mb-8 text-xl text-duo-gray-dark">
            Seu nível foi identificado como{" "}
            <span className="font-bold text-duo-green">{levelLabels[result.level]}</span>
          </p>

          {/* Stats cards */}
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-6">
              <Target className="mx-auto mb-3 h-10 w-10 text-duo-blue" />
              <div className="mb-2 text-2xl font-bold text-duo-text">{result.recommendedProgram}</div>
              <div className="text-sm font-bold text-duo-gray-dark">Programa Recomendado</div>
            </div>

            <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-6">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-duo-green" />
              <div className="mb-2 text-2xl font-bold text-duo-text">{result.weeklyGoal}x por semana</div>
              <div className="text-sm font-bold text-duo-gray-dark">Meta Semanal</div>
            </div>

            <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-6">
              <Flame className="mx-auto mb-3 h-10 w-10 text-duo-orange" />
              <div className="mb-2 text-2xl font-bold text-duo-text">{result.dietCalories} kcal</div>
              <div className="text-sm font-bold text-duo-gray-dark">Meta Calórica Diária</div>
            </div>

            <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-6">
              <div className="mx-auto mb-3 text-4xl">💪</div>
              <div className="mb-2 text-lg font-bold capitalize text-duo-text">{result.strengthAreas.join(", ")}</div>
              <div className="text-sm font-bold text-duo-gray-dark">Áreas de Foco</div>
            </div>
          </div>

          <div className="mb-8 rounded-2xl bg-duo-blue/10 p-6 text-left">
            <h3 className="mb-3 text-lg font-bold text-duo-text">O que vem a seguir?</h3>
            <ul className="space-y-2 text-duo-gray-dark">
              <li className="flex items-start gap-3">
                <span className="text-duo-green">✓</span>
                <span>Treinos personalizados baseados no seu nível</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-duo-green">✓</span>
                <span>Plano nutricional ajustado aos seus objetivos</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-duo-green">✓</span>
                <span>Acompanhamento de progresso com gamificação</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-duo-green">✓</span>
                <span>Conteúdo educacional sobre exercícios e músculos</span>
              </li>
            </ul>
          </div>

          <button onClick={onStart} className="duo-button-green w-full text-xl">
            COMEÇAR JORNADA
          </button>
        </div>
      </div>
    </div>
  )
}
