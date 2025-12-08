"use client";

import { useState, useEffect } from "react";
import { generateWorkoutWithAI } from "@/lib/mock-data";
import type {
  WorkoutSession,
  MuscleGroup,
  DifficultyLevel,
  UserProfile,
} from "@/lib/types";
import { Sparkles, Loader, Clock, Zap, User } from "lucide-react";

export function AIWorkoutGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] =
    useState<WorkoutSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState({
    muscleGroup: "peito" as MuscleGroup,
    difficulty: "intermediario" as DifficultyLevel,
    duration: 45,
    equipment: [] as string[],
  });

  useEffect(() => {
    const profile = localStorage.getItem("userProfile");
    if (profile) {
      const parsedProfile = JSON.parse(profile) as UserProfile;
      setUserProfile(parsedProfile);
      setPreferences({
        muscleGroup: "peito",
        difficulty: parsedProfile.fitnessLevel || "intermediario",
        duration: parsedProfile.workoutDuration || 45,
        equipment: parsedProfile.availableEquipment || [],
      });
    }
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);

    const prompt = `Crie um treino de ${preferences.muscleGroup} nível ${
      preferences.difficulty
    } com duração de ${preferences.duration} minutos.
    Preferências: ${userProfile?.preferredSets || 3} séries, faixa de ${
      userProfile?.preferredRepRange || "hipertrofia"
    }, 
    descanso ${userProfile?.restTime || "medio"}.
    Equipamentos disponíveis: ${
      preferences.equipment.join(", ") || "academia completa"
    }.
    ${
      userProfile?.injuries
        ? `Lesões a evitar: ${userProfile.injuries.join(", ")}`
        : ""
    }`;

    const workout = await generateWorkoutWithAI(prompt);
    setGeneratedWorkout(workout);
    setIsGenerating(false);
  };

  const muscleGroups: { value: MuscleGroup; label: string }[] = [
    { value: "peito", label: "Peito" },
    { value: "costas", label: "Costas" },
    { value: "pernas", label: "Pernas" },
    { value: "ombros", label: "Ombros" },
    { value: "bracos", label: "Braços" },
    { value: "core", label: "Core" },
    { value: "gluteos", label: "Glúteos" },
  ];

  const equipment = [
    "Barra",
    "Halteres",
    "Máquinas",
    "Peso corporal",
    "Elásticos",
    "Kettlebell",
  ];

  if (isGenerating) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader className="h-16 w-16 animate-spin text-duo-blue" />
          <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-duo-yellow" />
        </div>
        <div className="text-xl font-bold text-duo-text">
          IA criando seu treino...
        </div>
        <div className="text-sm text-duo-gray-dark">
          Personalizando para você
        </div>
      </div>
    );
  }

  if (generatedWorkout) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-duo-green bg-linear-to-br from-duo-green/10 to-duo-blue/10 p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="mb-2 text-2xl font-bold text-duo-text">
                {generatedWorkout.title}
              </div>
              <div className="text-sm text-duo-gray-dark">
                {generatedWorkout.description}
              </div>
            </div>
            <Sparkles className="h-8 w-8 text-duo-yellow" />
          </div>

          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-duo-gray-dark">
              <Clock className="h-4 w-4" />
              {generatedWorkout.estimatedTime}min
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-duo-gray-dark">
              <Zap className="h-4 w-4 text-duo-yellow" />+
              {generatedWorkout.xpReward} XP
            </div>
            <div className="rounded-full bg-duo-green/20 px-3 py-1 text-xs font-bold capitalize text-duo-green">
              {generatedWorkout.difficulty}
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-duo-text">Exercícios</h3>
          <div className="space-y-3">
            {generatedWorkout.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="rounded-2xl border-2 border-duo-gray-border bg-white p-4"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="mb-1 font-bold text-duo-text">
                      {index + 1}. {exercise.name}
                    </div>
                    <div className="text-sm text-duo-gray-dark">
                      {exercise.sets} séries x {exercise.reps} repetições
                    </div>
                  </div>
                  <div className="text-xs font-bold text-duo-gray-dark">
                    {exercise.rest}s descanso
                  </div>
                </div>
                {exercise.notes && (
                  <div className="mt-2 rounded-lg bg-duo-blue/10 p-2 text-xs text-duo-text">
                    {exercise.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setGeneratedWorkout(null)}
            className="rounded-2xl border-2 border-duo-gray-border bg-white py-3 font-bold text-duo-text transition-all hover:border-duo-gray-dark"
          >
            GERAR OUTRO
          </button>
          <button className="duo-button-green">SALVAR TREINO</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {userProfile && (
        <div className="rounded-2xl border-2 border-duo-blue bg-duo-blue/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <User className="h-5 w-5 text-duo-blue" />
            <span className="font-bold text-duo-text">Seu Perfil</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-duo-gray-dark">
            <div>• {userProfile.preferredSets} séries por exercício</div>
            <div>• Foco em {userProfile.preferredRepRange}</div>
            <div>• Descanso {userProfile.restTime}</div>
            <div>• {userProfile.weeklyWorkoutFrequency}x por semana</div>
          </div>
        </div>
      )}

      <div className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-duo-blue to-duo-green">
          <Sparkles className="h-10 w-10 text-white" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-duo-text">
          Gerador de Treinos com IA
        </h1>
        <p className="text-sm text-duo-gray-dark">
          Treinos personalizados baseados no seu perfil
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-bold text-duo-gray-dark">
            Grupo Muscular
          </label>
          <div className="grid grid-cols-2 gap-2">
            {muscleGroups.map((group) => (
              <button
                key={group.value}
                onClick={() =>
                  setPreferences({ ...preferences, muscleGroup: group.value })
                }
                className={`rounded-xl border-2 py-3 font-bold transition-all ${
                  preferences.muscleGroup === group.value
                    ? "border-duo-blue bg-duo-blue text-white"
                    : "border-duo-gray-border bg-white text-duo-text hover:border-duo-blue/50"
                }`}
              >
                {group.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-duo-gray-dark">
            Nível de Dificuldade
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              ["iniciante", "intermediario", "avancado"] as DifficultyLevel[]
            ).map((level) => (
              <button
                key={level}
                onClick={() =>
                  setPreferences({ ...preferences, difficulty: level })
                }
                className={`rounded-xl border-2 py-3 text-sm font-bold capitalize transition-all ${
                  preferences.difficulty === level
                    ? "border-duo-green bg-duo-green text-white"
                    : "border-duo-gray-border bg-white text-duo-text hover:border-duo-green/50"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-duo-gray-dark">
            Duração (minutos)
          </label>
          <input
            type="range"
            min="20"
            max="90"
            step="5"
            value={preferences.duration}
            onChange={(e) =>
              setPreferences({
                ...preferences,
                duration: Number.parseInt(e.target.value),
              })
            }
            className="w-full"
          />
          <div className="mt-2 text-center text-xl font-bold text-duo-text">
            {preferences.duration} minutos
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-duo-gray-dark">
            Equipamentos Disponíveis
          </label>
          <div className="grid grid-cols-2 gap-2">
            {equipment.map((eq) => (
              <button
                key={eq}
                onClick={() => {
                  const newEquipment = preferences.equipment.includes(eq)
                    ? preferences.equipment.filter((e) => e !== eq)
                    : [...preferences.equipment, eq];
                  setPreferences({ ...preferences, equipment: newEquipment });
                }}
                className={`rounded-xl border-2 py-2 text-sm font-bold transition-all ${
                  preferences.equipment.includes(eq)
                    ? "border-duo-yellow bg-duo-yellow/20 text-duo-yellow"
                    : "border-duo-gray-border bg-white text-duo-text hover:border-duo-yellow/50"
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        className="duo-button-green w-full text-lg"
      >
        <Sparkles className="mr-2 h-6 w-6" />
        GERAR TREINO PERSONALIZADO
      </button>
    </div>
  );
}
