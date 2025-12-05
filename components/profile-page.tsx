"use client"

import { Trophy, Flame, Zap, TrendingUp, Calendar, Award } from "lucide-react"
import { mockUserProgress, mockWorkoutHistory, mockPersonalRecords, mockWeightHistory } from "@/lib/mock-data"

export function ProfilePage() {
  console.log("[v0] Rendering ProfilePage")

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      {/* Header simples e funcional */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-duo-border bg-gradient-to-br from-duo-blue to-duo-purple p-8 text-white shadow-lg">
        <div className="relative">
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-5xl shadow-xl backdrop-blur-sm">
              👤
            </div>
            <div>
              <h1 className="mb-2 text-3xl font-bold">AtletaFit</h1>
              <p className="mb-3 text-white/80">@atletafit • Membro desde Jan 2025</p>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="font-bold">{mockUserProgress.workoutsCompleted}</span> Treinos
                </div>
                <div className="h-4 w-px bg-white/30" />
                <div>
                  <span className="font-bold">12</span> Amigos
                </div>
                <div className="h-4 w-px bg-white/30" />
                <div>
                  <span className="font-bold">{mockUserProgress.currentStreak}</span> Dias streak
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="mb-1 text-2xl font-bold">{mockUserProgress.currentLevel}</div>
              <div className="text-xs text-white/80">Nível</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="mb-1 text-2xl font-bold">{mockUserProgress.totalXP}</div>
              <div className="text-xs text-white/80">XP Total</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="mb-1 text-2xl font-bold">82.5</div>
              <div className="text-xs text-white/80">kg Atual</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm">
              <div className="mb-1 text-2xl font-bold">+4.5</div>
              <div className="text-xs text-white/80">kg Ganhos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de estatísticas destacadas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border-2 border-duo-border bg-white p-4 text-center">
          <Flame className="mx-auto mb-2 h-8 w-8 text-duo-orange" />
          <div className="mb-1 text-2xl font-bold text-duo-text">{mockUserProgress.currentStreak}</div>
          <div className="text-xs text-duo-gray-dark">Dias seguidos</div>
          <div className="mt-2 text-xs font-bold text-duo-orange">Recorde: {mockUserProgress.longestStreak}</div>
        </div>

        <div className="rounded-2xl border-2 border-duo-border bg-white p-4 text-center">
          <Zap className="mx-auto mb-2 h-8 w-8 text-duo-yellow" />
          <div className="mb-1 text-2xl font-bold text-duo-text">{mockUserProgress.totalXP}</div>
          <div className="text-xs text-duo-gray-dark">XP Total</div>
          <div className="mt-2 text-xs font-bold text-duo-yellow">
            {mockUserProgress.xpToNextLevel} até nível {mockUserProgress.currentLevel + 1}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-duo-border bg-white p-4 text-center">
          <Trophy className="mx-auto mb-2 h-8 w-8 text-duo-blue" />
          <div className="mb-1 text-2xl font-bold text-duo-text">#{mockUserProgress.currentLevel}</div>
          <div className="text-xs text-duo-gray-dark">Nível atual</div>
          <div className="mt-2 text-xs font-bold text-duo-blue">Top 15% global</div>
        </div>

        <div className="rounded-2xl border-2 border-duo-border bg-white p-4 text-center">
          <TrendingUp className="mx-auto mb-2 h-8 w-8 text-duo-green" />
          <div className="mb-1 text-2xl font-bold text-duo-text">{mockUserProgress.workoutsCompleted}</div>
          <div className="text-xs text-duo-gray-dark">Treinos</div>
          <div className="mt-2 text-xs font-bold text-duo-green">+5 esta semana</div>
        </div>
      </div>

      {/* Evolução de peso - gráfico simples */}
      <div className="rounded-2xl border-2 border-duo-border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-duo-green" />
            <h2 className="font-bold text-duo-text">Evolução de Peso</h2>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-duo-green">+4.5kg</div>
            <div className="text-xs text-duo-gray-dark">Últimos 3 meses</div>
          </div>
        </div>

        <div className="space-y-3">
          {mockWeightHistory.map((record, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="text-sm text-duo-gray-dark">{new Date(record.date).toLocaleDateString("pt-BR")}</div>
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-duo-border" style={{ width: `${record.weight}px` }}>
                  <div
                    className="h-full rounded-full bg-duo-green"
                    style={{ width: `${(record.weight / 85) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right font-bold text-duo-text">{record.weight}kg</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid de conteúdo */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Histórico de treinos */}
        <div className="rounded-2xl border-2 border-duo-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-duo-blue" />
            <h2 className="font-bold text-duo-text">Histórico Recente</h2>
          </div>
          <div className="space-y-3">
            {mockWorkoutHistory.slice(0, 3).map((workout, index) => (
              <div key={index} className="rounded-xl border-2 border-duo-border bg-duo-gray-light/30 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-duo-text">{workout.workoutName}</div>
                    <div className="text-xs text-duo-gray-dark">
                      {new Date(workout.date).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      workout.overallFeedback === "excelente"
                        ? "bg-duo-green/20 text-duo-green"
                        : workout.overallFeedback === "bom"
                          ? "bg-duo-blue/20 text-duo-blue"
                          : "bg-duo-orange/20 text-duo-orange"
                    }`}
                  >
                    {workout.overallFeedback}
                  </div>
                </div>
                <div className="flex gap-4 text-sm text-duo-gray-dark">
                  <div>⏱️ {workout.duration} min</div>
                  <div>💪 {workout.totalVolume.toLocaleString()} kg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recordes pessoais */}
        <div className="rounded-2xl border-2 border-duo-border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-duo-yellow" />
            <h2 className="font-bold text-duo-text">Recordes Pessoais</h2>
          </div>
          <div className="space-y-3">
            {mockPersonalRecords.map((record, index) => (
              <div key={index} className="rounded-xl border-2 border-duo-yellow/30 bg-duo-yellow/5 p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-duo-text">{record.exerciseName}</div>
                    <div className="text-xs text-duo-gray-dark">
                      {new Date(record.date).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                  <div className="text-2xl">🏆</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-duo-yellow">
                    {record.value}
                    {record.type === "max-weight" ? "kg" : " reps"}
                  </div>
                  {record.previousBest && (
                    <div className="rounded-full bg-duo-green/20 px-2 py-1 text-xs font-bold text-duo-green">
                      +{record.value - record.previousBest}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
