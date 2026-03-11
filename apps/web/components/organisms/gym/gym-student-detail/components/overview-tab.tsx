"use client";

import { DollarSign, Dumbbell, Target, UserPlus, Users } from "lucide-react";
import { DuoCard } from "@/components/duo";
import { WeightProgressCard } from "@/components/organisms/home/home/weight-progress-card";
import type { StudentData } from "@/lib/types";
import { formatCurrencyBR } from "@/lib/utils/currency";
import { formatDatePtBr } from "@/lib/utils/date-safe";

export interface OverviewTabProps {
  student: StudentData;
}

export function OverviewTab({ student }: OverviewTabProps) {
  const statusClass =
    student.gymMembership?.status === "active"
      ? "font-bold text-duo-green"
      : student.gymMembership?.status === "suspended"
        ? "font-bold text-duo-orange"
        : student.gymMembership?.status === "canceled"
          ? "font-bold text-duo-red"
          : "font-bold";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {student.gymMembership && (
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <DollarSign
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-[var(--duo-fg)]">
                Plano e Matrícula
              </h2>
            </div>
          </DuoCard.Header>
          <div className="space-y-3">
            <DuoCard.Root variant="default" size="sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-duo-gray-dark">Plano</span>
                <span className="text-duo-text font-bold">
                  {student.gymMembership.planName}
                </span>
              </div>
            </DuoCard.Root>
            <DuoCard.Root variant="default" size="sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-duo-gray-dark">Valor</span>
                <span className="text-duo-green font-bold">
                  {formatCurrencyBR(student.gymMembership.amount)}/mês
                </span>
              </div>
            </DuoCard.Root>
            <DuoCard.Root variant="default" size="sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-duo-gray-dark">
                  Próxima cobrança
                </span>
                <span className="text-duo-text font-bold">
                  {student.gymMembership.nextBillingDate
                    ? (formatDatePtBr(student.gymMembership.nextBillingDate) ??
                      "N/A")
                    : "N/A"}
                </span>
              </div>
            </DuoCard.Root>
            <DuoCard.Root variant="default" size="sm">
              <div className="flex justify-between items-center">
                <span className="font-bold text-duo-gray-dark">Status</span>
                <span className={statusClass}>
                  {student.gymMembership.status === "active" && "Ativo"}
                  {student.gymMembership.status === "suspended" && "Suspenso"}
                  {student.gymMembership.status === "canceled" && "Cancelado"}
                  {student.gymMembership.status === "pending" && "Pendente"}
                </span>
              </div>
            </DuoCard.Root>
          </div>
        </DuoCard.Root>
      )}
      {(student.assignedPersonals?.length ?? 0) > 0 && (
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <UserPlus
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-[var(--duo-fg)]">
                Personais Atribuídos
              </h2>
            </div>
          </DuoCard.Header>
          <div className="flex flex-wrap gap-2">
            {student.assignedPersonals?.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-duo-purple/15 px-3 py-1.5 text-sm font-bold text-duo-purple"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {p.name}
                {p.gym && (
                  <span className="text-xs opacity-80">
                    (via {p.gym.name})
                  </span>
                )}
              </span>
            ))}
          </div>
        </DuoCard.Root>
      )}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "Idade", value: `${student.age ?? 0} anos` },
            {
              label: "Gênero",
              value:
                student.gender === "male"
                  ? "Masculino"
                  : student.gender === "female"
                    ? "Feminino"
                    : student.gender || "—",
            },
            { label: "Altura", value: `${student.profile?.height ?? 0} cm` },
            { label: "Peso Atual", value: `${student.currentWeight ?? 0} kg` },
            {
              label: "Nível",
              value: String(
                student.profile?.fitnessLevel ?? "iniciante",
              ).replace("beginner", "iniciante"),
            },
            {
              label: "Frequência Semanal",
              value: `${student.profile?.weeklyWorkoutFrequency ?? 0}x semana`,
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
          {(student.profile?.goals ?? []).map((goal) => (
            <span
              key={goal}
              className="rounded-full bg-duo-blue/15 px-3 py-1 text-sm font-bold text-duo-blue capitalize"
            >
              {goal.replace("-", " ")}
            </span>
          ))}
          {(student.profile?.goals ?? []).length === 0 && (
            <span className="text-sm text-duo-gray-dark">
              Nenhum objetivo definido
            </span>
          )}
        </div>
        <h3 className="mb-3 mt-6 font-bold text-duo-text">
          Equipamentos Favoritos
        </h3>
        <div className="flex flex-wrap gap-2">
          {(student.favoriteEquipment ?? []).map((equipment) => (
            <span
              key={equipment}
              className="inline-flex items-center gap-1.5 rounded-full bg-duo-orange/15 px-3 py-1 text-sm font-bold text-duo-orange"
            >
              <Dumbbell className="h-3.5 w-3.5" />
              {equipment}
            </span>
          ))}
          {(student.favoriteEquipment ?? []).length === 0 && (
            <span className="text-sm text-duo-gray-dark">
              Nenhum equipamento preferido
            </span>
          )}
        </div>
      </DuoCard.Root>

      <div className="lg:col-span-2">
        <WeightProgressCard.Simple
          currentWeight={student.currentWeight ?? null}
          weightGain={
            (student as { weightGain?: number | null }).weightGain ?? null
          }
          hasWeightLossGoal={
            (student as { hasWeightLossGoal?: boolean }).hasWeightLossGoal ??
            false
          }
          weightHistory={student.weightHistory ?? []}
        />
      </div>
    </div>
  );
}
