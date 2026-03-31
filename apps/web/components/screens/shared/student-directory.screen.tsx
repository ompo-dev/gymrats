"use client";

import { Flame, Search, UserPlus } from "lucide-react";
import Image from "next/image";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import type { ScreenProps, ViewContract } from "@/components/foundations";
import { ScreenShell, createTestSelector } from "@/components/foundations";
import type { StudentData } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface StudentDirectoryAffiliationOption {
  id: string;
  gym: { id: string; name: string };
}

export interface StudentDirectoryScreenProps
  extends ScreenProps<{
    variant?: "gym" | "personal";
    students: StudentData[];
    searchQuery: string;
    statusFilter: string;
    networkFilter: string;
    gymFilter: string;
    personalAffiliations?: StudentDirectoryAffiliationOption[];
    onSearchQueryChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
    onNetworkFilterChange: (value: string) => void;
    onGymFilterChange: (value: string) => void;
    onAddStudent: () => void;
    onViewStudent: (studentId: string) => void;
  }> {}

export const studentDirectoryScreenContract: ViewContract = {
  componentId: "student-directory-screen",
  testId: "student-directory-screen",
};

export function getStudentDirectoryScreenId(variant: "gym" | "personal") {
  return variant === "personal"
    ? "personal-student-directory-screen"
    : "gym-student-directory-screen";
}

function getStreakColor(streak: number) {
  if (streak >= 20) return "text-duo-orange";
  if (streak >= 10) return "text-duo-green";
  return "text-duo-gray-dark";
}

function getAttendanceColor(rate: number) {
  if (rate >= 90) return "bg-duo-green";
  if (rate >= 70) return "bg-duo-blue";
  if (rate >= 50) return "bg-duo-orange";
  return "bg-duo-red";
}

export function StudentDirectoryScreen({
  variant = "gym",
  students,
  searchQuery,
  statusFilter,
  networkFilter,
  gymFilter,
  personalAffiliations = [],
  onSearchQueryChange,
  onStatusFilterChange,
  onNetworkFilterChange,
  onGymFilterChange,
  onAddStudent,
  onViewStudent,
}: StudentDirectoryScreenProps) {
  const screenId = getStudentDirectoryScreenId(variant);

  const statusOptions = [
    { value: "all", label: "Todos" },
    { value: "active", label: "Ativos" },
    { value: "inactive", label: "Inativos" },
  ];

  const networkOptions = [
    { value: "all", label: "Todos" },
    { value: "personal", label: "Pessoais" },
    { value: "gym", label: "Academia" },
  ];

  const gymOptions = [
    { value: "all", label: "Todas as academias" },
    ...personalAffiliations.map((affiliation) => ({
      value: affiliation.gym.id,
      label: affiliation.gym.name,
    })),
  ];

  return (
    <ScreenShell.Root screenId={screenId}>
      <FadeIn>
        <ScreenShell.Header>
          <ScreenShell.Heading>
            <ScreenShell.Title>Gestão de Alunos</ScreenShell.Title>
            <ScreenShell.Description>
              {students.length} aluno{students.length !== 1 ? "s" : ""}{" "}
              encontrado{students.length !== 1 ? "s" : ""}
            </ScreenShell.Description>
          </ScreenShell.Heading>
          <ScreenShell.Actions>
            <DuoButton
              onClick={onAddStudent}
              data-testid={createTestSelector(screenId, "add-student")}
            >
              <UserPlus className="h-5 w-5" />
              Novo Aluno
            </DuoButton>
          </ScreenShell.Actions>
        </ScreenShell.Header>
      </FadeIn>

      <ScreenShell.Body>
        <SlideIn delay={0.1}>
          <DuoCard.Root
            variant="default"
            padding="md"
            data-testid={createTestSelector(screenId, "filters")}
          >
            <DuoCard.Header>
              <div className="flex items-center gap-2">
                <Search
                  className="h-5 w-5 shrink-0"
                  style={{ color: "var(--duo-secondary)" }}
                  aria-hidden
                />
                <h2 className="font-bold text-[var(--duo-fg)]">
                  Buscar e Filtrar
                </h2>
              </div>
            </DuoCard.Header>
            <div className="space-y-4">
              <DuoInput.Simple
                placeholder="Buscar por nome ou email..."
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                leftIcon={<Search className="h-5 w-5" />}
                className="h-12"
                data-testid={createTestSelector(screenId, "search")}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DuoSelect.Simple
                  options={statusOptions}
                  value={statusFilter}
                  onChange={onStatusFilterChange}
                  placeholder="Status"
                  data-testid={createTestSelector(screenId, "status-filter")}
                />
                {variant === "personal" ? (
                  <DuoSelect.Simple
                    options={networkOptions}
                    value={networkFilter}
                    onChange={onNetworkFilterChange}
                    placeholder="Tipo de Vínculo"
                    data-testid={createTestSelector(screenId, "network-filter")}
                  />
                ) : null}
              </div>

              {variant === "personal" && networkFilter === "gym" ? (
                <DuoSelect.Simple
                  options={gymOptions}
                  value={gymFilter}
                  onChange={onGymFilterChange}
                  placeholder="Selecione a Academia"
                  data-testid={createTestSelector(screenId, "gym-filter")}
                />
              ) : null}
            </div>
          </DuoCard.Root>
        </SlideIn>

        <SlideIn delay={0.2}>
          <div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            data-testid={createTestSelector(screenId, "results")}
          >
            {students.map((student, index) => (
              <div
                key={student.id}
                className={index > 0 ? "pt-0" : undefined}
                data-testid={createTestSelector(screenId, "student-card")}
              >
                <DuoCard.Root
                  variant="default"
                  size="default"
                  onClick={() => onViewStudent(student.id)}
                  className="cursor-pointer transition-all hover:border-duo-green active:scale-[0.98]"
                >
                  <div className="mb-4 flex items-start gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={student.avatar || "/placeholder.svg"}
                        alt={student.name ?? ""}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-duo-text">
                        {student.name ?? ""}
                      </h3>
                      <p className="text-sm text-duo-gray-dark">
                        {student.email ?? ""}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-bold",
                            (student.membershipStatus ??
                              (student as { status?: string }).status) ===
                              "active"
                              ? "bg-duo-green text-white"
                              : "bg-gray-300 text-duo-gray-dark",
                          )}
                        >
                          {(student.membershipStatus ??
                            (student as { status?: string }).status) ===
                          "active"
                            ? "Ativo"
                            : "Inativo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <DuoCard.Root variant="default" size="sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Flame
                            className={cn(
                              "h-5 w-5 fill-current",
                              getStreakColor(student.currentStreak ?? 0),
                            )}
                          />
                          <span className="font-bold text-duo-text">
                            Sequência
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-xl font-bold",
                            getStreakColor(student.currentStreak ?? 0),
                          )}
                        >
                          {student.currentStreak ?? 0} dias
                        </span>
                      </div>
                    </DuoCard.Root>

                    <DuoCard.Root variant="default" size="sm">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-bold text-duo-text">
                          Frequência
                        </span>
                        <span className="text-xl font-bold text-duo-text">
                          {student.attendanceRate ?? 0}%
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={cn(
                            "h-full transition-all",
                            getAttendanceColor(student.attendanceRate ?? 0),
                          )}
                          style={{ width: `${student.attendanceRate ?? 0}%` }}
                        />
                      </div>
                    </DuoCard.Root>

                    <div className="grid grid-cols-2 gap-2">
                      <DuoCard.Root
                        variant="blue"
                        size="sm"
                        className="p-3 text-center"
                      >
                        <p className="text-2xl font-bold text-duo-blue">
                          {student.totalVisits ?? 0}
                        </p>
                        <p className="text-xs font-bold text-duo-gray-dark">
                          Treinos
                        </p>
                      </DuoCard.Root>
                      <DuoCard.Root
                        variant="default"
                        size="sm"
                        className="border-duo-purple bg-duo-purple/10 p-3 text-center"
                      >
                        <p className="text-2xl font-bold text-duo-purple">
                          {student.currentWeight ?? 0}kg
                        </p>
                        <p className="text-xs font-bold text-duo-gray-dark">
                          Peso
                        </p>
                      </DuoCard.Root>
                    </div>
                  </div>

                  {variant === "personal" ? (
                    <DuoCard.Root
                      variant="default"
                      size="sm"
                      className="mt-4 bg-gray-100 p-2 text-center"
                    >
                      <p className="text-xs font-bold text-duo-gray-dark">
                        Contexto:{" "}
                        <span className="text-duo-text">
                          {student.gymMembership?.gymName ??
                            "Atendimento independente"}
                        </span>
                      </p>
                    </DuoCard.Root>
                  ) : student.assignedTrainer ? (
                    <DuoCard.Root
                      variant="default"
                      size="sm"
                      className="mt-4 bg-gray-100 p-2 text-center"
                    >
                      <p className="text-xs font-bold text-duo-gray-dark">
                        Personal:{" "}
                        <span className="text-duo-text">
                          {student.assignedTrainer}
                        </span>
                      </p>
                    </DuoCard.Root>
                  ) : null}
                </DuoCard.Root>
              </div>
            ))}
          </div>
        </SlideIn>

        {students.length === 0 ? (
          <SlideIn delay={0.3}>
            <DuoCard.Root
              variant="default"
              size="default"
              className="p-12 text-center"
              data-testid={createTestSelector(screenId, "empty")}
            >
              <p className="text-xl font-bold text-duo-gray-dark">
                Nenhum aluno encontrado
              </p>
              <p className="text-duo-gray-dark">
                Tente ajustar os filtros de busca
              </p>
            </DuoCard.Root>
          </SlideIn>
        ) : null}
      </ScreenShell.Body>
    </ScreenShell.Root>
  );
}
