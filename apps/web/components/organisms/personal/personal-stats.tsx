"use client";

import { Building2, Target, Users } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoStatCard, DuoStatsGrid } from "@/components/duo";

export interface PersonalStatsProps {
  gyms: number;
  students: number;
  studentsViaGym: number;
  independentStudents: number;
}

export function PersonalStatsPage({
  gyms,
  students,
  studentsViaGym,
  independentStudents,
}: PersonalStatsProps) {
  const viaGymPercent =
    students > 0 ? Math.round((studentsViaGym / students) * 100) : 0;
  const independentPercent =
    students > 0 ? Math.round((independentStudents / students) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">
            Estatísticas Detalhadas
          </h1>
          <p className="text-sm text-duo-gray-dark">
            Visão geral das suas academias e alunos
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoStatsGrid.Root columns={2} className="gap-4">
          <DuoStatCard.Simple
            icon={Building2}
            value={String(gyms)}
            label="Academias"
            badge="Vinculadas"
            iconColor="var(--duo-primary)"
          />
          <DuoStatCard.Simple
            icon={Users}
            value={String(students)}
            label="Total de Alunos"
            badge="Atribuídos"
            iconColor="var(--duo-secondary)"
          />
          <DuoStatCard.Simple
            icon={Target}
            value={String(studentsViaGym)}
            label="Via Academia"
            badge={`${viaGymPercent}% do total`}
            iconColor="var(--duo-accent)"
          />
          <DuoStatCard.Simple
            icon={Users}
            value={String(independentStudents)}
            label="Independentes"
            badge={`${independentPercent}% do total`}
            iconColor="#A560E8"
          />
        </DuoStatsGrid.Root>
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <h2 className="font-bold text-duo-fg">Resumo</h2>
          </DuoCard.Header>
          <div className="space-y-3 text-sm text-duo-fg-muted">
            <p>
              Você atende {students} aluno{students !== 1 ? "s" : ""}
              {gyms > 0
                ? ` em ${gyms} academia${gyms !== 1 ? "s" : ""} vinculada${gyms !== 1 ? "s" : ""}`
                : ""}
              .
            </p>
            {studentsViaGym > 0 && (
              <p>
                {studentsViaGym} aluno{studentsViaGym !== 1 ? "s" : ""} via
                academia, {independentStudents} atendimento
                {independentStudents !== 1 ? "s" : ""} independente
                {independentStudents !== 1 ? "s" : ""}.
              </p>
            )}
          </div>
        </DuoCard.Root>
      </SlideIn>
    </div>
  );
}
