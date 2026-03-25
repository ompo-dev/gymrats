"use client";

import { Target, Users } from "lucide-react";
import { DuoCard } from "@/components/duo";

export interface PersonalOverviewTabProps {
  studentEmail: string;
  gymName?: string | null;
  profile?: {
    height?: number | null;
    weight?: number | null;
    fitnessLevel?: string | null;
    weeklyWorkoutFrequency?: number | null;
    goals?: string | null;
  } | null;
}

export function PersonalOverviewTab({
  studentEmail,
  gymName,
  profile,
}: PersonalOverviewTabProps) {
  let goals: string[] = [];
  try {
    goals = profile?.goals
      ? (JSON.parse(profile.goals) as string[]).filter(Boolean)
      : [];
  } catch {
    goals = [];
  }

  return (
    <div className="space-y-6">
      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Users
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">
              Informações do Perfil
            </h2>
          </div>
        </DuoCard.Header>
        <div className="space-y-3">
          <DuoCard.Root variant="default" size="sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-duo-gray-dark">Email</span>
              <span className="text-duo-text font-bold">
                {studentEmail || "—"}
              </span>
            </div>
          </DuoCard.Root>
          <DuoCard.Root variant="default" size="sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-duo-gray-dark">Vínculo</span>
              <span className="text-duo-text font-bold">
                {gymName
                  ? `Via academia ${gymName}`
                  : "Atendimento independente"}
              </span>
            </div>
          </DuoCard.Root>
        </div>
      </DuoCard.Root>

      <DuoCard.Root variant="default" padding="md">
        <DuoCard.Header>
          <div className="flex items-center gap-2">
            <Target
              className="h-5 w-5 shrink-0"
              style={{ color: "var(--duo-secondary)" }}
              aria-hidden
            />
            <h2 className="font-bold text-[var(--duo-fg)]">Objetivos</h2>
          </div>
        </DuoCard.Header>
        <div className="flex flex-wrap gap-2">
          {goals.map((goal) => (
            <span
              key={goal}
              className="rounded-full bg-duo-blue/15 px-3 py-1 text-sm font-bold text-duo-blue capitalize"
            >
              {goal.replace("-", " ")}
            </span>
          ))}
          {goals.length === 0 && (
            <span className="text-sm text-duo-gray-dark">
              Nenhum objetivo definido
            </span>
          )}
        </div>
        <h3 className="mb-3 mt-6 font-bold text-duo-text">Dados do perfil</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              label: "Altura",
              value: profile?.height ? `${profile.height} cm` : "—",
            },
            {
              label: "Peso",
              value: profile?.weight ? `${profile.weight} kg` : "—",
            },
            {
              label: "Nível",
              value: String(profile?.fitnessLevel ?? "iniciante").replace(
                "beginner",
                "iniciante",
              ),
            },
            {
              label: "Frequência Semanal",
              value: profile?.weeklyWorkoutFrequency
                ? `${profile.weeklyWorkoutFrequency}x semana`
                : "—",
            },
          ].map((info) => (
            <DuoCard.Root key={info.label} variant="default" size="sm">
              <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                <span className="font-bold text-duo-gray-dark text-sm sm:text-base">
                  {info.label}
                </span>
                <span className="text-duo-text text-sm sm:text-base wrap-break-words">
                  {info.value}
                </span>
              </div>
            </DuoCard.Root>
          ))}
        </div>
      </DuoCard.Root>
    </div>
  );
}
