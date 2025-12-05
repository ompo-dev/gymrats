"use client"

import { useState } from "react"
import type { CardioType, UserProfile } from "@/lib/types"
import { calculateCardioCalories, calculateTargetHeartRateZone } from "@/lib/calorie-calculator"
import { Play, Pause, Square, Heart, Flame, Timer, TrendingUp } from "lucide-react"

const mockUserProfile: UserProfile = {
  id: "1",
  name: "User",
  age: 28,
  gender: "male",
  weight: 75,
  height: 175,
  fitnessLevel: "intermediario",
  weeklyWorkoutFrequency: 4,
  workoutDuration: 60,
  goals: ["ganhar-massa"],
  availableEquipment: [],
  gymType: "academia-completa",
  preferredWorkoutTime: "manha",
  preferredSets: 3,
  preferredRepRange: "hipertrofia",
  restTime: "medio",
}

const cardioTypes: { type: CardioType; label: string; emoji: string; avgCaloriesPerMin: number }[] = [
  { type: "corrida", label: "Corrida", emoji: "🏃", avgCaloriesPerMin: 10 },
  { type: "bicicleta", label: "Bicicleta", emoji: "🚴", avgCaloriesPerMin: 8 },
  { type: "natacao", label: "Natação", emoji: "🏊", avgCaloriesPerMin: 11 },
  { type: "remo", label: "Remo", emoji: "🚣", avgCaloriesPerMin: 9 },
  { type: "eliptico", label: "Elíptico", emoji: "⚡", avgCaloriesPerMin: 7 },
  { type: "pular-corda", label: "Pular Corda", emoji: "🪢", avgCaloriesPerMin: 12 },
  { type: "caminhada", label: "Caminhada", emoji: "🚶", avgCaloriesPerMin: 4 },
  { type: "hiit", label: "HIIT", emoji: "💥", avgCaloriesPerMin: 14 },
]

export function CardioTracker() {
  const [selectedType, setSelectedType] = useState<CardioType>("corrida")
  const [isRunning, setIsRunning] = useState(false)
  const [duration, setDuration] = useState(0)
  const [intensity, setIntensity] = useState<"baixa" | "moderada" | "alta" | "muito-alta">("moderada")
  const [heartRate, setHeartRate] = useState(0)
  const [distance, setDistance] = useState(0)

  const selected = cardioTypes.find((c) => c.type === selectedType)!
  const targetHRZone = calculateTargetHeartRateZone(mockUserProfile.age, "cardio")
  const estimatedCalories =
    duration > 0 ? calculateCardioCalories(selectedType, duration, intensity, mockUserProfile) : 0

  return (
    <div className="space-y-4">
      {/* Seleção de Modalidade */}
      <div>
        <h3 className="mb-3 text-sm font-bold text-duo-gray-dark">Selecione a modalidade</h3>
        <div className="grid grid-cols-4 gap-2">
          {cardioTypes.map((cardio) => (
            <button
              key={cardio.type}
              onClick={() => setSelectedType(cardio.type)}
              className={`rounded-xl border-2 p-3 transition-all ${
                selectedType === cardio.type
                  ? "border-duo-blue bg-duo-blue/10 shadow-md"
                  : "border-duo-border bg-white hover:border-duo-blue/50"
              }`}
            >
              <div className="mb-1 text-2xl">{cardio.emoji}</div>
              <div className="text-xs font-bold text-duo-text">{cardio.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Informações em Tempo Real */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border-2 border-duo-border bg-gradient-to-br from-duo-orange/10 to-duo-orange/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Timer className="h-5 w-5 text-duo-orange" />
            <span className="text-xs font-bold text-duo-gray-dark">Duração</span>
          </div>
          <div className="text-3xl font-black text-duo-text">
            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, "0")}
          </div>
          <div className="text-xs text-duo-gray-dark">minutos</div>
        </div>

        <div className="rounded-2xl border-2 border-duo-border bg-gradient-to-br from-duo-red/10 to-duo-red/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Flame className="h-5 w-5 text-duo-red" />
            <span className="text-xs font-bold text-duo-gray-dark">Calorias</span>
          </div>
          <div className="text-3xl font-black text-duo-text">{estimatedCalories}</div>
          <div className="text-xs text-duo-gray-dark">kcal queimadas</div>
        </div>

        <div className="rounded-2xl border-2 border-duo-border bg-gradient-to-br from-duo-green/10 to-duo-green/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-duo-green" />
            <span className="text-xs font-bold text-duo-gray-dark">Distância</span>
          </div>
          <div className="text-3xl font-black text-duo-text">{distance.toFixed(2)}</div>
          <div className="text-xs text-duo-gray-dark">km</div>
        </div>

        <div className="rounded-2xl border-2 border-duo-border bg-gradient-to-br from-pink-500/10 to-pink-500/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            <span className="text-xs font-bold text-duo-gray-dark">FC</span>
          </div>
          <div className="text-3xl font-black text-duo-text">{heartRate}</div>
          <div className="text-xs text-duo-gray-dark">bpm</div>
        </div>
      </div>

      {/* Zona de FC Alvo */}
      <div className="rounded-xl border-2 border-duo-border bg-white p-4">
        <div className="mb-2 text-sm font-bold text-duo-text">Zona de FC Alvo (Cardio)</div>
        <div className="mb-2 flex items-center justify-between text-xs text-duo-gray-dark">
          <span>{targetHRZone.min} bpm</span>
          <span>{targetHRZone.max} bpm</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-duo-border">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-pink-600 transition-all"
            style={{
              width: heartRate > 0 ? `${Math.min((heartRate / targetHRZone.max) * 100, 100)}%` : "0%",
            }}
          />
        </div>
      </div>

      {/* Controle de Intensidade */}
      <div>
        <label className="mb-2 block text-sm font-bold text-duo-gray-dark">Intensidade</label>
        <div className="grid grid-cols-4 gap-2">
          {(["baixa", "moderada", "alta", "muito-alta"] as const).map((int) => (
            <button
              key={int}
              onClick={() => setIntensity(int)}
              className={`rounded-xl border-2 py-2 text-xs font-bold capitalize transition-all ${
                intensity === int
                  ? "border-duo-yellow bg-duo-yellow text-white"
                  : "border-duo-border bg-white text-duo-text hover:border-duo-yellow/50"
              }`}
            >
              {int}
            </button>
          ))}
        </div>
      </div>

      {/* Controles */}
      <div className="flex gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="duo-button-green flex-1 flex items-center justify-center gap-2"
        >
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {isRunning ? "PAUSAR" : "INICIAR"}
        </button>
        <button
          onClick={() => {
            setIsRunning(false)
            setDuration(0)
            setDistance(0)
            setHeartRate(0)
          }}
          className="rounded-2xl border-2 border-duo-border bg-white px-6 py-3 font-bold text-duo-text hover:bg-duo-border/30"
        >
          <Square className="h-5 w-5" />
        </button>
      </div>

      <div className="rounded-xl border-2 border-duo-blue bg-duo-blue/5 p-4">
        <div className="text-xs font-bold text-duo-blue">💡 Dica</div>
        <div className="mt-1 text-xs text-duo-text">
          O cálculo de calorias considera seu peso, idade, gênero e perfil hormonal para maior precisão!
        </div>
      </div>
    </div>
  )
}
