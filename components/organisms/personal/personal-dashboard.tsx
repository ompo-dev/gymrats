"use client";

import { DuoCard } from "@/components/duo";

export interface PersonalDashboardStats {
  gyms: number;
  students: number;
  studentsViaGym: number;
  independentStudents: number;
}

export interface PersonalDashboardProps {
  profile: { name?: string | null } | null;
  stats: PersonalDashboardStats;
}

export function PersonalDashboardPage({
  profile,
  stats,
}: PersonalDashboardProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <DuoCard.Root>
        <h1 className="text-2xl font-bold text-duo-fg">
          Olá, {profile?.name?.split(" ")[0] || "Personal"}!
        </h1>
        <p className="mt-1 text-sm text-duo-fg-muted">
          Gerencie academias vinculadas e alunos acompanhados.
        </p>
      </DuoCard.Root>

      <DuoCard.Root>
        <h2 className="text-lg font-bold text-duo-fg">Resumo</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-duo-border p-3">
            <p className="text-duo-fg-muted">Academias</p>
            <p className="text-xl font-bold text-duo-fg">{stats.gyms}</p>
          </div>
          <div className="rounded-xl border border-duo-border p-3">
            <p className="text-duo-fg-muted">Alunos</p>
            <p className="text-xl font-bold text-duo-fg">{stats.students}</p>
          </div>
          <div className="rounded-xl border border-duo-border p-3">
            <p className="text-duo-fg-muted">Via academia</p>
            <p className="text-xl font-bold text-duo-fg">
              {stats.studentsViaGym}
            </p>
          </div>
          <div className="rounded-xl border border-duo-border p-3">
            <p className="text-duo-fg-muted">Independentes</p>
            <p className="text-xl font-bold text-duo-fg">
              {stats.independentStudents}
            </p>
          </div>
        </div>
      </DuoCard.Root>
    </div>
  );
}
