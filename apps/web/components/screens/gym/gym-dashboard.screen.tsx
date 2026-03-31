"use client";

import { Dumbbell, LogIn, Users } from "lucide-react";
import Image from "next/image";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoAlert, DuoButton, DuoCard, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import { DashboardSection } from "@/components/organisms/shared";
import { RelativeTime } from "@/components/molecules/relative-time";
import type { CheckIn, Equipment, GymProfile, GymStats, StudentData } from "@/lib/types";

export interface GymDashboardScreenProps
  extends ScreenProps<{
    profile: GymProfile;
    stats: GymStats;
    students: StudentData[];
    equipment: Equipment[];
    recentCheckIns?: CheckIn[];
    subscription?: {
      id: string;
      plan: string;
      status: string;
      currentPeriodEnd: Date;
    } | null;
    onOpenCheckIn?: () => void;
  }> {}

export const gymDashboardScreenContract: ViewContract = {
  componentId: "gym-dashboard-screen",
  testId: "gym-dashboard-screen",
};

export function GymDashboardScreen({
  profile,
  stats,
  students,
  equipment,
  recentCheckIns = [],
  subscription,
  onOpenCheckIn,
}: GymDashboardScreenProps) {
  const { today, week, month } = stats;
  const equipmentInUse = equipment.filter((eq) => eq.status === "in-use");
  const equipmentMaintenance = equipment.filter((eq) => eq.status === "maintenance");

  return (
    <ScreenShell.Root screenId={gymDashboardScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Notice>
          {subscription?.status === "past_due" ? (
            <DuoAlert variant="danger" title="Assinatura Atrasada">
              Sua assinatura da Nutrifit para esta unidade está atrasada.
              Regularize para evitar a suspensão do acesso.
            </DuoAlert>
          ) : null}

          <ScreenShell.Header>
            <ScreenShell.Heading>
              <ScreenShell.Title>Dashboard</ScreenShell.Title>
              <ScreenShell.Description>
                Visão geral da sua academia em tempo real
              </ScreenShell.Description>
            </ScreenShell.Heading>
            <ScreenShell.Actions>
              <DuoButton
                type="button"
                onClick={onOpenCheckIn}
                className="flex flex-shrink-0 items-center gap-2"
                data-testid={createTestSelector(
                  gymDashboardScreenContract.testId,
                  "check-in-trigger",
                )}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Registrar Check-in
              </DuoButton>
            </ScreenShell.Actions>
          </ScreenShell.Header>
        </ScreenShell.Notice>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <DuoStatsGrid.Root
            columns={4}
            className="gap-4"
            data-testid={createTestSelector(
              gymDashboardScreenContract.testId,
              "metrics",
            )}
          >
            <DuoStatCard.Simple
              icon={Users}
              value={String(today.checkins)}
              label="Check-ins Hoje"
              badge={`Pico: ${today.peakHour}`}
              iconColor="var(--duo-primary)"
            />
            <DuoStatCard.Simple
              icon={Users}
              value={String(today.activeStudents)}
              label="Alunos Ativos"
              badge={`Total: ${profile.totalStudents}`}
              iconColor="var(--duo-secondary)"
            />
            <DuoStatCard.Simple
              icon={Dumbbell}
              value={String(today.equipmentInUse)}
              label="Equipamentos em Uso"
              badge={`Total: ${equipment.length}`}
              iconColor="var(--duo-accent)"
            />
            <DuoStatCard.Simple
              icon={Users}
              value={`+${week.newMembers}`}
              label="Novos Alunos"
              badge="Esta semana"
              iconColor="#A560E8"
            />
          </DuoStatsGrid.Root>
        </SlideIn>

        <ScreenShell.SectionGrid>
          <SlideIn delay={0.2}>
            <DashboardSection.Root
              title="Check-ins Recentes"
              icon={
                <Users
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden="true"
                />
              }
            >
              <DashboardSection.List>
                {recentCheckIns.length === 0 ? (
                  <DashboardSection.Empty>
                    Nenhum check-in recente.
                  </DashboardSection.Empty>
                ) : null}
                {recentCheckIns.map((checkin) => {
                  const student = students.find((item) => item.id === checkin.studentId);
                  return (
                    <DuoCard.Root key={checkin.id} variant="default" size="sm">
                      <div className="flex items-center gap-3">
                        {student?.avatar ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                            <Image
                              src={student.avatar || "/placeholder.svg"}
                              alt={student.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : null}
                        <div className="flex-1">
                          <p className="text-sm font-bold text-duo-text">
                            {checkin.studentName}
                          </p>
                          <p className="text-xs text-duo-gray-dark">
                            <RelativeTime timestamp={checkin.timestamp} />
                          </p>
                        </div>
                      </div>
                    </DuoCard.Root>
                  );
                })}
              </DashboardSection.List>
            </DashboardSection.Root>
          </SlideIn>

          <SlideIn delay={0.3}>
            <DashboardSection.Root
              title="Equipamentos em Tempo Real"
              icon={
                <Dumbbell
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden="true"
                />
              }
            >
              <DashboardSection.List>
                {equipmentInUse.length === 0 && equipmentMaintenance.length === 0 ? (
                  <DashboardSection.Empty>
                    Nenhum equipamento em uso ou manutenção no momento.
                  </DashboardSection.Empty>
                ) : null}

                {equipmentInUse.map((item) => (
                  <DuoCard.Root key={item.id} variant="blue" size="sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-duo-text">{item.name}</p>
                        <p className="text-xs text-duo-gray-dark">
                          {item.currentUser?.studentName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-duo-gray-dark">
                          <RelativeTime
                            timestamp={item.currentUser?.startTime ?? new Date()}
                          />
                        </p>
                      </div>
                    </div>
                  </DuoCard.Root>
                ))}

                {equipmentMaintenance.length > 0 ? (
                  <>
                    <div className="my-2 border-t-2 border-duo-border" />
                    <h3 className="text-sm font-bold text-duo-text">Em Manutenção</h3>
                    {equipmentMaintenance.map((item) => (
                      <DuoCard.Root key={item.id} variant="orange" size="sm">
                        <p className="text-sm font-bold text-duo-text">{item.name}</p>
                        <p className="text-xs text-duo-gray-dark">
                          Aguardando manutenção
                        </p>
                      </DuoCard.Root>
                    ))}
                  </>
                ) : null}
              </DashboardSection.List>
            </DashboardSection.Root>
          </SlideIn>

          <SlideIn delay={0.4}>
            <DashboardSection.Root
              title="Top Alunos do Mês"
              icon={
                <Users
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden="true"
                />
              }
            >
              <DashboardSection.List>
                {month.topStudents.length === 0 ? (
                  <DashboardSection.Empty>
                    Nenhum dado de frequência neste mês ainda.
                  </DashboardSection.Empty>
                ) : null}
                {month.topStudents.slice(0, 5).map((student, index) => {
                  const variants = [
                    "highlighted",
                    "yellow",
                    "blue",
                    "default",
                    "default",
                  ] as const;

                  return (
                    <DuoCard.Root
                      key={student.id}
                      variant={variants[index] || "default"}
                      size="sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-duo-purple text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        {student.avatar ? (
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full">
                            <Image
                              src={student.avatar || "/placeholder.svg"}
                              alt={student.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : null}
                        <div className="flex-1">
                          <p className="text-sm font-bold text-duo-text">
                            {student.name}
                          </p>
                          <p className="text-xs text-duo-gray-dark">
                            {student.totalVisits} treinos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-duo-green">
                            {student.attendanceRate ?? 0}%
                          </p>
                          <p className="text-xs text-duo-gray-dark">frequência</p>
                        </div>
                      </div>
                    </DuoCard.Root>
                  );
                })}
              </DashboardSection.List>
            </DashboardSection.Root>
          </SlideIn>

          <SlideIn delay={0.5}>
            <DashboardSection.Root
              title="Estatísticas da Semana"
              icon={
                <Users
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden="true"
                />
              }
            >
              <DashboardSection.List>
                <DuoCard.Root variant="highlighted" size="sm">
                  <p className="text-xs font-bold text-duo-gray-dark">
                    Total de Check-ins
                  </p>
                  <p className="text-2xl font-bold text-duo-green">
                    {week.totalCheckins}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-duo-green"
                      style={{ width: "85%" }}
                    />
                  </div>
                </DuoCard.Root>

                <DuoCard.Root variant="blue" size="sm">
                  <p className="text-xs font-bold text-duo-gray-dark">
                    Média Diária
                  </p>
                  <p className="text-2xl font-bold text-duo-blue">
                    {week.avgDailyCheckins}
                  </p>
                  <p className="text-xs text-duo-gray-dark">alunos por dia</p>
                </DuoCard.Root>

                <DuoCard.Root
                  variant="default"
                  size="sm"
                  className="border-duo-purple bg-duo-purple/10"
                >
                  <p className="text-xs font-bold text-duo-gray-dark">
                    Taxa de Retenção
                  </p>
                  <p className="text-2xl font-bold text-duo-purple">
                    {month.retentionRate}%
                  </p>
                  <p className="text-xs text-duo-gray-dark">últimos 30 dias</p>
                </DuoCard.Root>
              </DashboardSection.List>
            </DashboardSection.Root>
          </SlideIn>
        </ScreenShell.SectionGrid>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
