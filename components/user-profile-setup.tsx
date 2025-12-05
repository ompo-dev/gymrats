"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { UserProfile, DifficultyLevel } from "@/lib/types"

export function UserProfileSetup() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    weeklyWorkoutFrequency: 3,
    workoutDuration: 60,
    preferredSets: 3,
    preferredRepRange: "hipertrofia",
    restTime: "medio",
    goals: [],
    availableEquipment: [],
    isTransgender: false,
    hormoneTreatment: "none",
    hormoneTreatmentDuration: 0,
  })

  const handleComplete = () => {
    localStorage.setItem("userProfile", JSON.stringify(profile))
    router.push("/")
  }

  const equipment = [
    "Barra Olímpica",
    "Halteres",
    "Máquinas",
    "Cabos",
    "Smith Machine",
    "Leg Press",
    "Banco Ajustável",
    "Pull-up Bar",
    "Kettlebell",
    "Elásticos",
    "TRX",
    "Peso Corporal",
  ]

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">👤</div>
            <h1 className="mb-2 text-3xl font-bold text-duo-text">Informações Pessoais</h1>
            <p className="text-duo-gray-dark">Vamos conhecer você melhor</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold text-duo-gray-dark">Nome</label>
              <input
                type="text"
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full rounded-xl border-2 border-duo-border px-4 py-3 font-bold text-duo-text focus:border-duo-blue focus:outline-none"
                placeholder="Seu nome"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-duo-gray-dark">Idade</label>
                <input
                  type="number"
                  value={profile.age || ""}
                  onChange={(e) => setProfile({ ...profile, age: Number.parseInt(e.target.value) })}
                  className="w-full rounded-xl border-2 border-duo-border px-4 py-3 font-bold text-duo-text focus:border-duo-blue focus:outline-none"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-duo-gray-dark">Gênero</label>
                <select
                  value={profile.gender || ""}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value as any })}
                  className="w-full rounded-xl border-2 border-duo-border px-4 py-3 font-bold text-duo-text focus:border-duo-blue focus:outline-none"
                >
                  <option value="">Selecione</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                  <option value="non-binary">Não-binário</option>
                  <option value="prefer-not-to-say">Prefiro não dizer</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border-2 border-duo-border bg-duo-border/20 p-4">
              <label className="mb-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={profile.isTransgender || false}
                  onChange={(e) => setProfile({ ...profile, isTransgender: e.target.checked })}
                  className="h-5 w-5"
                />
                <span className="text-sm font-bold text-duo-gray-dark">Sou transgênero e faço terapia hormonal</span>
              </label>

              {profile.isTransgender && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-2 block text-xs font-bold text-duo-gray-dark">Tipo de terapia hormonal</label>
                    <select
                      value={profile.hormoneTreatment || "none"}
                      onChange={(e) => setProfile({ ...profile, hormoneTreatment: e.target.value as any })}
                      className="w-full rounded-xl border-2 border-duo-border px-4 py-2 text-sm font-bold text-duo-text"
                    >
                      <option value="none">Não faço terapia hormonal</option>
                      <option value="testosterone">Testosterona</option>
                      <option value="estrogen">Estrogênio</option>
                    </select>
                  </div>

                  {profile.hormoneTreatment !== "none" && (
                    <div>
                      <label className="mb-2 block text-xs font-bold text-duo-gray-dark">
                        Há quanto tempo (meses)?
                      </label>
                      <input
                        type="number"
                        value={profile.hormoneTreatmentDuration || ""}
                        onChange={(e) =>
                          setProfile({ ...profile, hormoneTreatmentDuration: Number.parseInt(e.target.value) })
                        }
                        className="w-full rounded-xl border-2 border-duo-border px-4 py-2 text-sm font-bold text-duo-text"
                        placeholder="Ex: 6"
                      />
                      <p className="mt-1 text-xs text-duo-gray-dark">
                        Isso ajuda a calcular suas calorias queimadas com mais precisão
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-duo-gray-dark">Altura (cm)</label>
                <input
                  type="number"
                  value={profile.height || ""}
                  onChange={(e) => setProfile({ ...profile, height: Number.parseInt(e.target.value) })}
                  className="w-full rounded-xl border-2 border-duo-border px-4 py-3 font-bold text-duo-text focus:border-duo-blue focus:outline-none"
                  placeholder="170"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-duo-gray-dark">Peso (kg)</label>
                <input
                  type="number"
                  value={profile.weight || ""}
                  onChange={(e) => setProfile({ ...profile, weight: Number.parseInt(e.target.value) })}
                  className="w-full rounded-xl border-2 border-duo-border px-4 py-3 font-bold text-duo-text focus:border-duo-blue focus:outline-none"
                  placeholder="70"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-duo-gray-dark">Nível de Experiência</label>
              <div className="grid grid-cols-3 gap-3">
                {(["iniciante", "intermediario", "avancado"] as DifficultyLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setProfile({ ...profile, fitnessLevel: level })}
                    className={`rounded-xl border-2 py-4 font-bold capitalize transition-all ${
                      profile.fitnessLevel === level
                        ? "border-duo-green bg-duo-green text-white"
                        : "border-duo-border bg-white text-duo-text hover:border-duo-green/50"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} className="duo-button-green w-full">
              CONTINUAR
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">🎯</div>
            <h1 className="mb-2 text-3xl font-bold text-duo-text">Seus Objetivos</h1>
            <p className="text-duo-gray-dark">O que você quer alcançar?</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-bold text-duo-gray-dark">Selecione seus objetivos</label>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "perder-peso", label: "Perder Peso", emoji: "⚖️" },
                  { value: "ganhar-massa", label: "Ganhar Massa", emoji: "💪" },
                  { value: "definir", label: "Definir Músculos", emoji: "✨" },
                  { value: "saude", label: "Saúde Geral", emoji: "❤️" },
                  { value: "forca", label: "Ganhar Força", emoji: "🏋️" },
                  { value: "resistencia", label: "Resistência", emoji: "🏃" },
                ].map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => {
                      const goals = profile.goals?.includes(goal.value as any)
                        ? profile.goals.filter((g) => g !== goal.value)
                        : [...(profile.goals || []), goal.value as any]
                      setProfile({ ...profile, goals })
                    }}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      profile.goals?.includes(goal.value as any)
                        ? "border-duo-blue bg-duo-blue/10"
                        : "border-duo-border bg-white hover:border-duo-blue/50"
                    }`}
                  >
                    <div className="mb-1 text-2xl">{goal.emoji}</div>
                    <div className="font-bold text-duo-text">{goal.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-duo-gray-dark">
                Quantas vezes por semana pode treinar?
              </label>
              <div className="grid grid-cols-7 gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                  <button
                    key={days}
                    onClick={() => setProfile({ ...profile, weeklyWorkoutFrequency: days })}
                    className={`aspect-square rounded-xl border-2 font-bold transition-all ${
                      profile.weeklyWorkoutFrequency === days
                        ? "border-duo-green bg-duo-green text-white"
                        : "border-duo-border bg-white text-duo-text hover:border-duo-green/50"
                    }`}
                  >
                    {days}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-duo-gray-dark">
                Duração preferida por treino (minutos)
              </label>
              <input
                type="range"
                min="20"
                max="120"
                step="10"
                value={profile.workoutDuration}
                onChange={(e) => setProfile({ ...profile, workoutDuration: Number.parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="mt-2 text-center text-2xl font-bold text-duo-text">{profile.workoutDuration} min</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => setStep(1)} className="rounded-2xl border-2 border-duo-border py-3 font-bold">
                VOLTAR
              </button>
              <button onClick={() => setStep(3)} className="duo-button-green">
                CONTINUAR
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 text-6xl">🏋️</div>
            <h1 className="mb-2 text-3xl font-bold text-duo-text">Preferências de Treino</h1>
            <p className="text-duo-gray-dark">Como você gosta de treinar?</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-bold text-duo-gray-dark">Número de séries por exercício</label>
              <div className="grid grid-cols-4 gap-3">
                {[2, 3, 4, 5].map((sets) => (
                  <button
                    key={sets}
                    onClick={() => setProfile({ ...profile, preferredSets: sets })}
                    className={`rounded-xl border-2 py-4 font-bold transition-all ${
                      profile.preferredSets === sets
                        ? "border-duo-green bg-duo-green text-white"
                        : "border-duo-border bg-white text-duo-text hover:border-duo-green/50"
                    }`}
                  >
                    {sets}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-duo-gray-dark">Faixa de repetições</label>
              <div className="grid gap-3">
                {[
                  { value: "forca", label: "Força (1-5 reps)", desc: "Peso muito alto" },
                  { value: "hipertrofia", label: "Hipertrofia (8-12 reps)", desc: "Crescimento muscular" },
                  { value: "resistencia", label: "Resistência (15+ reps)", desc: "Definição e tônus" },
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setProfile({ ...profile, preferredRepRange: range.value as any })}
                    className={`rounded-xl border-2 p-4 text-left transition-all ${
                      profile.preferredRepRange === range.value
                        ? "border-duo-green bg-duo-green/10"
                        : "border-duo-border bg-white hover:border-duo-green/50"
                    }`}
                  >
                    <div className="mb-1 font-bold text-duo-text">{range.label}</div>
                    <div className="text-xs text-duo-gray-dark">{range.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block text-sm font-bold text-duo-gray-dark">Tempo de descanso entre séries</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "curto", label: "Curto", time: "30-45s" },
                  { value: "medio", label: "Médio", time: "60-90s" },
                  { value: "longo", label: "Longo", time: "2-3min" },
                ].map((rest) => (
                  <button
                    key={rest.value}
                    onClick={() => setProfile({ ...profile, restTime: rest.value as any })}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      profile.restTime === rest.value
                        ? "border-duo-yellow bg-duo-yellow/10"
                        : "border-duo-border bg-white hover:border-duo-yellow/50"
                    }`}
                  >
                    <div className="mb-1 font-bold text-duo-text">{rest.label}</div>
                    <div className="text-xs text-duo-gray-dark">{rest.time}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button onClick={() => setStep(2)} className="rounded-2xl border-2 border-duo-border py-3 font-bold">
                VOLTAR
              </button>
              <button onClick={() => setStep(4)} className="duo-button-green">
                CONTINUAR
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl">🔧</div>
          <h1 className="mb-2 text-3xl font-bold text-duo-text">Equipamentos Disponíveis</h1>
          <p className="text-duo-gray-dark">Selecione o que você tem acesso</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-3 block text-sm font-bold text-duo-gray-dark">Tipo de academia</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "academia-completa", label: "Academia Completa", emoji: "🏢" },
                { value: "academia-basica", label: "Academia Básica", emoji: "🏠" },
                { value: "home-gym", label: "Home Gym", emoji: "🏡" },
                { value: "peso-corporal", label: "Só Peso Corporal", emoji: "🤸" },
              ].map((gym) => (
                <button
                  key={gym.value}
                  onClick={() => setProfile({ ...profile, gymType: gym.value as any })}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${
                    profile.gymType === gym.value
                      ? "border-duo-blue bg-duo-blue/10"
                      : "border-duo-border bg-white hover:border-duo-blue/50"
                  }`}
                >
                  <div className="mb-1 text-2xl">{gym.emoji}</div>
                  <div className="font-bold text-duo-text">{gym.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-bold text-duo-gray-dark">Equipamentos específicos</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {equipment.map((eq) => (
                <button
                  key={eq}
                  onClick={() => {
                    const equip = profile.availableEquipment?.includes(eq)
                      ? profile.availableEquipment.filter((e) => e !== eq)
                      : [...(profile.availableEquipment || []), eq]
                    setProfile({ ...profile, availableEquipment: equip })
                  }}
                  className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                    profile.availableEquipment?.includes(eq)
                      ? "border-duo-green bg-duo-green text-white"
                      : "border-duo-border bg-white text-duo-text hover:border-duo-green/50"
                  }`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => setStep(3)} className="rounded-2xl border-2 border-duo-border py-3 font-bold">
              VOLTAR
            </button>
            <button onClick={handleComplete} className="duo-button-green">
              FINALIZAR
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
