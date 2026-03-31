"use client";

import {
  Building2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoAlert, DuoStatCard, DuoStatsGrid } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import { DashboardSection } from "@/components/organisms/shared";
import {
  AcademyListItemCard,
  StudentListItemCard,
} from "@/components/organisms/sections/list-item-cards";
import type { FinancialSummary } from "@/lib/types";
import { formatCurrencyBR } from "@/lib/utils/currency";

export interface PersonalDashboardStats {
  gyms: number;
  students: number;
  studentsViaGym: number;
  independentStudents: number;
}

export interface PersonalAffiliationItem {
  id: string;
  gym: {
    id: string;
    name: string;
    image?: string | null;
    logo?: string | null;
  };
}

export interface PersonalStudentItem {
  id: string;
  student: {
    id: string;
    user?: { id: string; name?: string | null; email?: string | null } | null;
  };
  gym?: { id: string; name: string } | null;
}

export interface PersonalDashboardScreenProps
  extends ScreenProps<{
    profile: { name?: string | null } | null;
    stats: PersonalDashboardStats;
    affiliations?: PersonalAffiliationItem[];
    students?: PersonalStudentItem[];
    subscription?: {
      id: string;
      plan: string;
      status: string;
      currentPeriodEnd?: Date | string;
    } | null;
    financialSummary?: FinancialSummary | null;
    onViewGym?: (gymId: string) => void;
  }> {}

export const personalDashboardScreenContract: ViewContract = {
  componentId: "personal-dashboard-screen",
  testId: "personal-dashboard-screen",
};

export function PersonalDashboardScreen({
  profile,
  stats,
  affiliations = [],
  students = [],
  subscription,
  financialSummary,
  onViewGym,
}: PersonalDashboardScreenProps) {
  const topStudents = students.slice(0, 5);
  const studentsByGym = students.reduce(
    (acc, item) => {
      const gymName = item.gym?.name;
      if (!gymName) {
        return acc;
      }

      acc[gymName] = (acc[gymName] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const daysLeft =
    subscription?.status === "trialing" && subscription.currentPeriodEnd
      ? Math.max(
          0,
          Math.ceil(
            (new Date(subscription.currentPeriodEnd).getTime() - Date.now()) /
              (1000 * 3600 * 24),
          ),
        )
      : null;

  return (
    <ScreenShell.Root screenId={personalDashboardScreenContract.testId}>
      <FadeIn>
        <ScreenShell.Notice>
          {subscription?.status === "past_due" ? (
            <DuoAlert variant="danger" title="Assinatura Atrasada">
              Sua assinatura está atrasada. Regularize para evitar a suspensão
              do acesso.
            </DuoAlert>
          ) : null}

          {subscription?.status === "trialing" && daysLeft != null ? (
            <DuoAlert variant="warning" title="Período de Avaliação">
              Seu trial termina em {daysLeft} dia{daysLeft === 1 ? "" : "s"}.
              Assine um plano para continuar usando.
            </DuoAlert>
          ) : null}

          <ScreenShell.Header>
            <ScreenShell.Heading>
              <ScreenShell.Title>
                Olá, {profile?.name?.split(" ")[0] || "Personal"}!
              </ScreenShell.Title>
              <ScreenShell.Description>
                Visão geral das suas academias e alunos
              </ScreenShell.Description>
            </ScreenShell.Heading>
          </ScreenShell.Header>
        </ScreenShell.Notice>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <DuoStatsGrid.Root
            columns={4}
            className="gap-4"
            data-testid={createTestSelector(
              personalDashboardScreenContract.testId,
              "metrics",
            )}
          >
            <DuoStatCard.Simple
              icon={Building2}
              value={String(stats.gyms)}
              label="Academias"
              badge="Vinculadas"
              iconColor="var(--duo-primary)"
            />
            <DuoStatCard.Simple
              icon={Users}
              value={String(stats.students)}
              label="Alunos"
              badge="Total"
              iconColor="var(--duo-secondary)"
            />
            <DuoStatCard.Simple
              icon={Users}
              value={String(stats.studentsViaGym)}
              label="Via academia"
              badge="Atribuídos"
              iconColor="var(--duo-accent)"
            />
            <DuoStatCard.Simple
              icon={Users}
              value={String(stats.independentStudents)}
              label="Independentes"
              badge="Diretos"
              iconColor="#A560E8"
            />
          </DuoStatsGrid.Root>
        </SlideIn>

        {financialSummary ? (
          <SlideIn delay={0.15}>
            <DashboardSection.Root
              title="Resumo Financeiro do Mês"
              icon={
                <DollarSign
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden="true"
                />
              }
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-duo-green/10 p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-duo-green" />
                    <p className="text-xs font-bold text-duo-gray-dark">
                      Receita
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-bold text-duo-green">
                    {formatCurrencyBR(financialSummary.totalRevenue)}
                  </p>
                </div>
                <div className="rounded-xl bg-duo-danger/10 p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingDown className="h-3.5 w-3.5 text-duo-danger" />
                    <p className="text-xs font-bold text-duo-gray-dark">
                      Despesas
                    </p>
                  </div>
                  <p className="mt-1 text-lg font-bold text-duo-danger">
                    {formatCurrencyBR(financialSummary.totalExpenses)}
                  </p>
                </div>
                <div className="rounded-xl bg-duo-primary/10 p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-duo-primary" />
                    <p className="text-xs font-bold text-duo-gray-dark">
                      Lucro
                    </p>
                  </div>
                  <p
                    className={`mt-1 text-lg font-bold ${
                      financialSummary.netProfit >= 0
                        ? "text-duo-green"
                        : "text-duo-danger"
                    }`}
                  >
                    {formatCurrencyBR(financialSummary.netProfit)}
                  </p>
                </div>
              </div>
            </DashboardSection.Root>
          </SlideIn>
        ) : null}

        <ScreenShell.SectionGrid>
          <SlideIn delay={0.2}>
            <DashboardSection.Root
              title="Alunos Recentes"
              icon={
                <Users
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden="true"
                />
              }
              data-testid={createTestSelector(
                personalDashboardScreenContract.testId,
                "recent-students",
              )}
            >
              <DashboardSection.List>
                {topStudents.length === 0 ? (
                  <DashboardSection.Empty>
                    Nenhum aluno vinculado ainda.
                  </DashboardSection.Empty>
                ) : null}
                {topStudents.map((item) => (
                  <StudentListItemCard
                    key={item.id}
                    image="/placeholder.svg"
                    name={item.student?.user?.name ?? "Aluno"}
                    subtitle={item.gym ? `via ${item.gym.name}` : "Independente"}
                  />
                ))}
              </DashboardSection.List>
            </DashboardSection.Root>
          </SlideIn>

          <SlideIn delay={0.3}>
            <DashboardSection.Root
              title="Academias Vinculadas"
              icon={
                <Building2
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden="true"
                />
              }
              data-testid={createTestSelector(
                personalDashboardScreenContract.testId,
                "affiliations",
              )}
            >
              <DashboardSection.List>
                {affiliations.length === 0 ? (
                  <DashboardSection.Empty>
                    Nenhuma academia vinculada ainda.
                  </DashboardSection.Empty>
                ) : null}
                {affiliations.map((affiliation) => (
                  <AcademyListItemCard
                    key={affiliation.id}
                    image={
                      affiliation.gym.logo ||
                      affiliation.gym.image ||
                      "/placeholder.svg"
                    }
                    name={affiliation.gym.name}
                    onClick={() => onViewGym?.(affiliation.gym.id)}
                    planName={`${studentsByGym[affiliation.gym.name] ?? 0} alunos`}
                    hoverColor="duo-blue"
                  />
                ))}
              </DashboardSection.List>
            </DashboardSection.Root>
          </SlideIn>
        </ScreenShell.SectionGrid>
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
