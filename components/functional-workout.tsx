"use client"

import { useState } from "react"
import { functionalExercises } from "@/lib/functional-exercises-data"
import type { FunctionalCategory } from "@/lib/types"
import { Users, Baby, HeartPulse } from "lucide-react"

export function FunctionalWorkout() {
  const [selectedCategory, setSelectedCategory] = useState<FunctionalCategory | "all">("all")
  const [selectedAudience, setSelectedAudience] = useState<"criancas" | "adultos" | "idosos" | "all">("all")

  const categories: { value: FunctionalCategory | "all"; label: string; emoji: string }[] = [
    { value: "all", label: "Todos", emoji: "🎯" },
    { value: "mobilidade", label: "Mobilidade", emoji: "🧘" },
    { value: "equilibrio", label: "Equilíbrio", emoji: "⚖️" },
    { value: "coordenacao", label: "Coordenação", emoji: "🎪" },
    { value: "agilidade", label: "Agilidade", emoji: "⚡" },
    { value: "core-funcional", label: "Core", emoji: "💪" },
  ]

  const filteredExercises = functionalExercises.filter((ex) => {
    const categoryMatch = selectedCategory === "all" || ex.category === selectedCategory
    const audienceMatch = selectedAudience === "all" || ex.targetAudience.includes(selectedAudience)
    return categoryMatch && audienceMatch
  })

  return (
    <div className="space-y-4">
      {/* Filtro de Público */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-duo-gray-dark">Para quem?</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: "all", label: "Todos", icon: Users },
            { value: "criancas", label: "Crianças", icon: Baby },
            { value: "adultos", label: "Adultos", icon: Users },
            { value: "idosos", label: "Idosos", icon: HeartPulse },
          ].map((aud) => (
            <button
              key={aud.value}
              onClick={() => setSelectedAudience(aud.value as any)}
              className={`rounded-xl border-2 p-3 transition-all ${
                selectedAudience === aud.value
                  ? "border-duo-purple bg-duo-purple/10"
                  : "border-duo-border bg-white hover:border-duo-purple/50"
              }`}
            >
              <aud.icon className="mx-auto mb-1 h-5 w-5" />
              <div className="text-xs font-bold text-duo-text">{aud.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Filtro de Categoria */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-duo-gray-dark">Categoria</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex-shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition-all ${
                selectedCategory === cat.value
                  ? "border-duo-blue bg-duo-blue text-white"
                  : "border-duo-border bg-white text-duo-text hover:border-duo-blue/50"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Exercícios */}
      <div className="space-y-3">
        {filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className="rounded-2xl border-2 border-duo-border bg-white p-4 hover:border-duo-blue/50 transition-colors"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h4 className="text-lg font-black text-duo-text">{exercise.name}</h4>
                <div className="mt-1 flex gap-2">
                  {exercise.targetAudience.map((aud) => (
                    <span
                      key={aud}
                      className="rounded-full bg-duo-purple/10 px-2 py-1 text-xs font-bold text-duo-purple capitalize"
                    >
                      {aud}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-duo-orange">{exercise.caloriesBurnedPerMinute} cal/min</div>
                <div className="text-xs text-duo-gray-dark capitalize">{exercise.difficulty}</div>
              </div>
            </div>

            <p className="mb-3 text-sm text-duo-gray-dark">{exercise.description}</p>

            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-duo-border/30 p-2">
                <div className="text-xs text-duo-gray-dark">Séries</div>
                <div className="font-bold text-duo-text">{exercise.sets}x</div>
              </div>
              <div className="rounded-lg bg-duo-border/30 p-2">
                <div className="text-xs text-duo-gray-dark">Duração</div>
                <div className="font-bold text-duo-text">{exercise.duration}</div>
              </div>
              <div className="rounded-lg bg-duo-border/30 p-2">
                <div className="text-xs text-duo-gray-dark">Descanso</div>
                <div className="font-bold text-duo-text">{exercise.rest}s</div>
              </div>
            </div>

            <div>
              <div className="mb-1 text-xs font-bold text-duo-gray-dark">Benefícios:</div>
              <div className="flex flex-wrap gap-1">
                {exercise.benefits.map((benefit, i) => (
                  <span key={i} className="rounded-full bg-duo-green/10 px-2 py-1 text-xs text-duo-green">
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="rounded-xl border-2 border-duo-border bg-duo-border/10 p-8 text-center">
          <div className="mb-2 text-4xl">🔍</div>
          <div className="text-sm font-bold text-duo-gray-dark">Nenhum exercício encontrado para esses filtros</div>
        </div>
      )}
    </div>
  )
}
