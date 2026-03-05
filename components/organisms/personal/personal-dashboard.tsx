"use client";

import { Building2, Users } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import {
  DuoAlert,
  DuoCard,
  DuoStatCard,
  DuoStatsGrid,
} from "@/components/duo";

export interface PersonalDashboardStats {
  gyms: number;
  students: number;
  studentsViaGym: number;
  independentStudents: number;
}

export interface PersonalAffiliationItem {
  id: string;
  gym: { id: string; name: string; image?: string | null; logo?: string | null };
}

export interface PersonalStudentItem {
  id: string;
  student: {
    id: string;
    user?: { id: string; name?: string | null; email?: string | null } | null;
  };
  gym?: { id: string; name: string } | null;
}

export interface PersonalDashboardProps {
  profile: { name?: string | null } | null;
  stats: PersonalDashboardStats;
  affiliations?: PersonalAffiliationItem[];
  students?: PersonalStudentItem[];
  subscription?: {
    id: string;
    plan: string;
    status: string;
    currentPeriodEnd?: Date;
  } | null;
}

export function PersonalDashboardPage({
  profile,
  stats,
  affiliations = [],
  students = [],
  subscription,
}: PersonalDashboardProps) {
  const studentName = (s: PersonalStudentItem) =>
    s.student?.user?.name ?? "Aluno";

  const studentsByGym = students
    .filter((s) => s.gym?.id)
    .reduce(
      (acc, s) => {
        const gymName = s.gym!.name;
        if (!acc[gymName]) acc[gymName] = [];
        acc[gymName].push(s);
        return acc;
      },
      {} as Record<string, PersonalStudentItem[]>,
    );

  const topStudents = students.slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="space-y-6">
          {subscription?.status === "past_due" && (
            <DuoAlert variant="danger" title="Assinatura Atrasada">
              Sua assinatura está atrasada. Regularize para evitar a suspensão
              do acesso.
            </DuoAlert>
          )}

          <div className="text-center sm:text-left">
            <h1 className="mb-1 text-3xl font-bold text-duo-text">
              Olá, {profile?.name?.split(" ")[0] || "Personal"}!
            </h1>
            <p className="text-sm text-duo-gray-dark">
              Visão geral das suas academias e alunos
            </p>
          </div>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoStatsGrid.Root columns={4} className="gap-4">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <SlideIn delay={0.2}>
          <DuoCard.Root variant="default" padding="md">
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Users
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden
                />
                <h2 className="font-bold text-[var(--duo-fg)]">
                  Alunos Recentes
                </h2>
              </div>
            </DuoCard.Header>
            <div className="space-y-3">
              {topStudents.length === 0 && (
                <p className="py-4 text-center text-sm text-duo-gray-dark">
                  Nenhum aluno vinculado ainda.
                </p>
              )}
              {topStudents.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard.Root variant="default" size="sm">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-duo-bg">
                        <Image
                          src="/placeholder.svg"
                          alt={studentName(item)}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-duo-text truncate">
                          {studentName(item)}
                        </p>
                        <p className="text-xs text-duo-gray-dark truncate">
                          {item.gym ? `via ${item.gym.name}` : "Independente"}
                        </p>
                      </div>
                    </div>
                  </DuoCard.Root>
                </motion.div>
              ))}
            </div>
          </DuoCard.Root>
        </SlideIn>

        <SlideIn delay={0.3}>
          <DuoCard.Root variant="default" padding="md">
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Building2
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden
                />
                <h2 className="font-bold text-[var(--duo-fg)]">
                  Academias Vinculadas
                </h2>
              </div>
            </DuoCard.Header>
            <div className="space-y-3">
              {affiliations.length === 0 && (
                <p className="py-4 text-center text-sm text-duo-gray-dark">
                  Nenhuma academia vinculada ainda.
                </p>
              )}
              {affiliations.map((a, index) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard.Root variant="blue" size="sm">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-duo-bg">
                        <Image
                          src={a.gym.logo || a.gym.image || "/placeholder.svg"}
                          alt={a.gym.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-duo-text truncate">
                          {a.gym.name}
                        </p>
                        <p className="text-xs text-duo-gray-dark">
                          {studentsByGym[a.gym.name]?.length ?? 0} alunos
                        </p>
                      </div>
                    </div>
                  </DuoCard.Root>
                </motion.div>
              ))}
            </div>
          </DuoCard.Root>
        </SlideIn>
      </div>
    </div>
  );
}
