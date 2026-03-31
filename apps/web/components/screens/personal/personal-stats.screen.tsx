"use client";

import { Building2, Target, Users } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoCard, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";

export interface PersonalStatsScreenProps
  extends ScreenProps<{
    gyms: number;
    students: number;
    studentsViaGym: number;
    independentStudents: number;
  }> {}

export const personalStatsScreenContract: ViewContract = {
  componentId: "personal-stats-screen",
  testId: "personal-stats-screen",
};

export function PersonalStatsScreen({
  gyms,
  students,
  studentsViaGym,
  independentStudents,
}: PersonalStatsScreenProps) {
  const viaGymPercent =
    students > 0 ? Math.round((studentsViaGym / students) * 100) : 0;
  const independentPercent =
    students > 0 ? Math.round((independentStudents / students) * 100) : 0;

  return (
    <ScreenShell.Root screenId={personalStatsScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading className="text-center sm:text-center">
            <ScreenShell.Title>Estatísticas Detalhadas</ScreenShell.Title>
            <ScreenShell.Description>
              Visão geral das suas academias e alunos
            </ScreenShell.Description>
          </ScreenShell.Heading>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <DuoStatsGrid.Root
            columns={2}
            className="gap-4"
            data-testid={createTestSelector(
              personalStatsScreenContract.testId,
              "metrics",
            )}
          >
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
              {studentsViaGym > 0 ? (
                <p>
                  {studentsViaGym} aluno{studentsViaGym !== 1 ? "s" : ""} via
                  academia, {independentStudents} atendimento
                  {independentStudents !== 1 ? "s" : ""} independente
                  {independentStudents !== 1 ? "s" : ""}.
                </p>
              ) : null}
            </div>
          </DuoCard.Root>
        </SlideIn>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
