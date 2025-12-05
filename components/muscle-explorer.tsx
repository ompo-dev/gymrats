"use client"

import { useState, useEffect } from "react"
import { muscleDatabase, exerciseDatabase } from "@/lib/educational-data"
import type { MuscleInfo, ExerciseInfo } from "@/lib/types"
import { ChevronRight, Book, Dumbbell } from "lucide-react"

interface MuscleExplorerProps {
  muscleId?: string | null
  exerciseId?: string | null
  onMuscleSelect?: (id: string) => void
  onExerciseSelect?: (id: string) => void
  onBack?: () => void
}

export function MuscleExplorer({
  muscleId,
  exerciseId,
  onMuscleSelect,
  onExerciseSelect,
  onBack,
}: MuscleExplorerProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleInfo | null>(null)
  const [selectedExercise, setSelectedExercise] = useState<ExerciseInfo | null>(null)
  const [view, setView] = useState<"muscles" | "exercises">("muscles")

  // Sincronizar com search params
  useEffect(() => {
    if (muscleId) {
      const muscle = muscleDatabase.find((m) => m.id === muscleId)
      if (muscle) setSelectedMuscle(muscle)
    } else {
      setSelectedMuscle(null)
    }
  }, [muscleId])

  useEffect(() => {
    if (exerciseId) {
      const exercise = exerciseDatabase.find((e) => e.id === exerciseId)
      if (exercise) setSelectedExercise(exercise)
    } else {
      setSelectedExercise(null)
    }
  }, [exerciseId])

  const handleMuscleSelect = (muscle: MuscleInfo) => {
    setSelectedMuscle(muscle)
    onMuscleSelect?.(muscle.id)
  }

  const handleExerciseSelect = (exercise: ExerciseInfo) => {
    setSelectedExercise(exercise)
    onExerciseSelect?.(exercise.id)
  }

  const handleBack = () => {
    setSelectedMuscle(null)
    setSelectedExercise(null)
    onBack?.()
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="mb-2 text-3xl font-bold text-duo-text">Biblioteca de Conhecimento</h1>
        <p className="text-sm text-duo-gray-dark">Aprenda sobre anatomia e técnica com base científica</p>
      </div>

      {/* Toggle view */}
      <div className="flex gap-2 rounded-2xl border-2 border-duo-gray-border bg-white p-1">
        <button
          onClick={() => setView("muscles")}
          className={`flex-1 rounded-xl py-3 font-bold transition-all ${
            view === "muscles" ? "bg-duo-blue text-white" : "text-duo-gray-dark hover:bg-duo-gray-light"
          }`}
        >
          <Book className="mx-auto mb-1 h-5 w-5" />
          Músculos
        </button>
        <button
          onClick={() => setView("exercises")}
          className={`flex-1 rounded-xl py-3 font-bold transition-all ${
            view === "exercises" ? "bg-duo-green text-white" : "text-duo-gray-dark hover:bg-duo-gray-light"
          }`}
        >
          <Dumbbell className="mx-auto mb-1 h-5 w-5" />
          Exercícios
        </button>
      </div>

      {/* Muscles view */}
      {view === "muscles" && !selectedMuscle && (
        <div className="space-y-3">
          {muscleDatabase.map((muscle) => (
            <button
              key={muscle.id}
              onClick={() => handleMuscleSelect(muscle)}
              className="w-full rounded-2xl border-2 border-duo-gray-border bg-white p-4 text-left transition-all hover:border-duo-blue hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 font-bold text-duo-text">{muscle.name}</div>
                  <div className="text-sm text-duo-gray-dark">{muscle.scientificName}</div>
                </div>
                <ChevronRight className="h-6 w-6 text-duo-gray-dark" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Muscle detail */}
      {view === "muscles" && selectedMuscle && (
        <MuscleDetail muscle={selectedMuscle} onBack={handleBack} />
      )}

      {/* Exercises view */}
      {view === "exercises" && !selectedExercise && (
        <div className="space-y-3">
          {exerciseDatabase.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => handleExerciseSelect(exercise)}
              className="w-full rounded-2xl border-2 border-duo-gray-border bg-white p-4 text-left transition-all hover:border-duo-green hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-2 font-bold text-duo-text">{exercise.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {exercise.primaryMuscles.map((muscle, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-duo-green/20 px-2 py-0.5 text-xs font-bold capitalize text-duo-green"
                      >
                        {muscle}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-duo-gray-dark" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Exercise detail */}
      {view === "exercises" && selectedExercise && (
        <ExerciseDetail exercise={selectedExercise} onBack={handleBack} />
      )}
    </div>
  )
}

function MuscleDetail({ muscle, onBack }: { muscle: MuscleInfo; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 font-bold text-duo-blue hover:underline">
        ← Voltar
      </button>

      <div className="rounded-2xl border-2 border-duo-blue bg-gradient-to-br from-duo-blue/10 to-duo-green/10 p-6">
        <h2 className="mb-2 text-2xl font-bold text-duo-text">{muscle.name}</h2>
        <div className="mb-4 text-sm font-bold italic text-duo-gray-dark">{muscle.scientificName}</div>
        <p className="leading-relaxed text-duo-text">{muscle.description}</p>
      </div>

      <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-6">
        <h3 className="mb-3 text-lg font-bold text-duo-text">Funções</h3>
        <ul className="space-y-2">
          {muscle.functions.map((func, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-duo-green text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="text-duo-text">{func}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-6">
        <h3 className="mb-3 text-lg font-bold text-duo-text">Exercícios Comuns</h3>
        <div className="flex flex-wrap gap-2">
          {muscle.commonExercises.map((exercise, i) => (
            <span key={i} className="rounded-xl bg-duo-blue/20 px-3 py-2 text-sm font-bold text-duo-blue">
              {exercise}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-duo-yellow bg-duo-yellow/10 p-6">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-duo-text">
          <span>💡</span>
          Curiosidades Anatômicas
        </h3>
        <ul className="space-y-2">
          {muscle.anatomyFacts.map((fact, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-duo-yellow">•</span>
              <span className="text-duo-text">{fact}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function ExerciseDetail({ exercise, onBack }: { exercise: ExerciseInfo; onBack: () => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 font-bold text-duo-green hover:underline">
        ← Voltar
      </button>

      <div className="rounded-2xl border-2 border-duo-green bg-gradient-to-br from-duo-green/10 to-duo-blue/10 p-6">
        <h2 className="mb-4 text-2xl font-bold text-duo-text">{exercise.name}</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-duo-orange/20 px-3 py-1 text-xs font-bold capitalize text-duo-orange">
            {exercise.difficulty}
          </span>
          {exercise.equipment.map((eq, i) => (
            <span key={i} className="rounded-full bg-duo-gray-light px-3 py-1 text-xs font-bold text-duo-gray-dark">
              {eq}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <div>
            <div className="mb-1 text-xs font-bold text-duo-gray-dark">MÚSCULOS PRIMÁRIOS</div>
            <div className="flex flex-wrap gap-1">
              {exercise.primaryMuscles.map((m, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-duo-green/20 px-2 py-1 text-xs font-bold capitalize text-duo-green"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          {exercise.secondaryMuscles.length > 0 && (
            <div>
              <div className="mb-1 text-xs font-bold text-duo-gray-dark">SECUNDÁRIOS</div>
              <div className="flex flex-wrap gap-1">
                {exercise.secondaryMuscles.map((m, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-duo-blue/20 px-2 py-1 text-xs font-bold capitalize text-duo-blue"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-duo-gray-border bg-white p-6">
        <h3 className="mb-3 text-lg font-bold text-duo-text">Como Executar</h3>
        <ol className="space-y-3">
          {exercise.instructions.map((instruction, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-duo-blue text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-1 text-duo-text">{instruction}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border-2 border-duo-green bg-duo-green/10 p-6">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-duo-text">
          <span>✓</span>
          Dicas Importantes
        </h3>
        <ul className="space-y-2">
          {exercise.tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-duo-green">•</span>
              <span className="text-duo-text">{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border-2 border-duo-red bg-duo-red/10 p-6">
        <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-duo-text">
          <span>⚠️</span>
          Erros Comuns
        </h3>
        <ul className="space-y-2">
          {exercise.commonMistakes.map((mistake, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-duo-red">×</span>
              <span className="text-duo-text">{mistake}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border-2 border-duo-yellow bg-duo-yellow/10 p-6">
        <h3 className="mb-3 text-lg font-bold text-duo-text">Benefícios</h3>
        <ul className="space-y-2">
          {exercise.benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-duo-yellow">+</span>
              <span className="text-duo-text">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {exercise.scientificEvidence && (
        <div className="rounded-2xl border-2 border-duo-blue bg-duo-blue/10 p-6">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-duo-text">
            <span>🔬</span>
            Evidência Científica
          </h3>
          <p className="leading-relaxed text-duo-text">{exercise.scientificEvidence}</p>
        </div>
      )}
    </div>
  )
}
