"use client";

import { Loader2, Search, UserMinus, UserPlus } from "lucide-react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import { usePersonalStudents } from "@/hooks/use-personal-students";
import { cn } from "@/lib/utils";
import { AddPersonalStudentModal } from "./add-personal-student-modal";
import { PersonalStudentDetail } from "./personal-student-detail";

export interface PersonalStudentItem {
  id: string;
  student: {
    id: string;
    user?: { id?: string; name?: string | null; email?: string | null } | null;
  };
  gym?: { id: string; name: string } | null;
}

export interface PersonalGymOption {
  id: string;
  gym: { id: string; name: string };
}

export interface PersonalStudentsPageProps {
  students: PersonalStudentItem[];
  affiliations: PersonalGymOption[];
  onRefresh: () => Promise<void>;
}

export function PersonalStudentsPage({
  students,
  affiliations,
  onRefresh,
}: PersonalStudentsPageProps) {
  const {
    searchQuery,
    setSearchQuery,
    filter,
    gymIdFilter,
    setGymIdFilter,
    setFilterAll,
    setFilterIndependent,
    setFilterViaGym,
    assignModalOpen,
    setAssignModalOpen,
    removingId,
    studentId,
    setStudentId,
    selectedAssignment,
    isLoadingAssignment,
    filteredStudents,
    handleRemove,
    handleOpenDetail,
    handleBack,
    FILTER_ALL,
    FILTER_INDEPENDENT,
    FILTER_VIA_GYM,
  } = usePersonalStudents({ students, affiliations, onRefresh });

  if (studentId) {
    if (isLoadingAssignment) {
      return (
        <div className="mx-auto max-w-4xl space-y-6">
          <DuoCard.Root className="p-8 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-duo-fg-muted" />
            <p className="mt-4 text-duo-fg-muted">Carregando aluno...</p>
          </DuoCard.Root>
        </div>
      );
    }
    if (selectedAssignment) {
      return (
        <PersonalStudentDetail
          studentId={studentId}
          assignment={selectedAssignment}
          onBack={handleBack}
        />
      );
    }
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <DuoCard.Root className="p-8 text-center">
          <p className="text-duo-fg-muted">Aluno não encontrado.</p>
          <DuoButton onClick={handleBack} className="mt-4">
            Voltar para lista
          </DuoButton>
        </DuoCard.Root>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <FadeIn>
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-duo-text">Alunos</h1>
          <p className="text-sm text-duo-gray-dark">
            Gerencie alunos independentes e via academia
          </p>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <DuoCard.Root variant="default" padding="md">
          <DuoCard.Header>
            <div className="flex items-center gap-2">
              <Search
                className="h-5 w-5 shrink-0"
                style={{ color: "var(--duo-secondary)" }}
                aria-hidden
              />
              <h2 className="font-bold text-duo-fg">Buscar</h2>
            </div>
            <DuoInput.Simple
              label="Nome ou email"
              placeholder="Buscar aluno..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </DuoCard.Header>
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.2}>
        <DuoCard.Root>
          <h3 className="font-semibold text-duo-fg">Atribuir aluno</h3>
          <p className="mt-1 text-sm text-duo-fg-muted">
            Busque por @ ou email para vincular um aluno a você.
          </p>
          <DuoButton
            onClick={() => setAssignModalOpen(true)}
            variant="primary"
            className="mt-3"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Atribuir aluno
          </DuoButton>
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.3}>
        <DuoCard.Root>
          <h3 className="font-semibold text-duo-fg">Filtro</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={setFilterAll}
              className={cn(
                "rounded-xl border-2 px-3 py-1.5 text-sm font-semibold",
                filter === FILTER_ALL
                  ? "border-duo-primary bg-duo-primary/10 text-duo-primary"
                  : "border-duo-border text-duo-fg-muted hover:border-duo-fg-muted",
              )}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={setFilterIndependent}
              className={cn(
                "rounded-xl border-2 px-3 py-1.5 text-sm font-semibold",
                filter === FILTER_INDEPENDENT
                  ? "border-duo-primary bg-duo-primary/10 text-duo-primary"
                  : "border-duo-border text-duo-fg-muted hover:border-duo-fg-muted",
              )}
            >
              Independentes
            </button>
            {affiliations.length > 0 && (
              <button
                type="button"
                onClick={setFilterViaGym}
                className={cn(
                  "rounded-xl border-2 px-3 py-1.5 text-sm font-semibold",
                  filter === FILTER_VIA_GYM
                    ? "border-duo-primary bg-duo-primary/10 text-duo-primary"
                    : "border-duo-border text-duo-fg-muted hover:border-duo-fg-muted",
                )}
              >
                Via academia
              </button>
            )}
          </div>
          {filter === FILTER_VIA_GYM && affiliations.length > 0 && (
            <div className="mt-3">
              <DuoSelect.Simple
                label="Academia"
                value={gymIdFilter}
                onChange={setGymIdFilter}
                options={[
                  { value: "", label: "Selecione uma academia" },
                  ...affiliations.map((a) => ({
                    value: a.gym.id,
                    label: a.gym.name,
                  })),
                ]}
              />
            </div>
          )}
        </DuoCard.Root>
      </SlideIn>

      {filteredStudents.length === 0 ? (
        <DuoCard.Root>
          <p className="text-sm text-duo-fg-muted">
            {students.length === 0
              ? "Nenhum aluno atribuído."
              : "Nenhum aluno corresponde ao filtro."}
          </p>
        </DuoCard.Root>
      ) : (
        <SlideIn delay={0.4}>
          {filteredStudents.map((item) => (
            <DuoCard.Root key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => handleOpenDetail(item.student.id)}
                >
                  <p className="font-semibold text-duo-fg">
                    {item.student?.user?.name || "Aluno"}
                  </p>
                  <p className="mt-1 text-sm text-duo-fg-muted">
                    {item.gym?.name
                      ? `Via ${item.gym.name}`
                      : "Atendimento independente"}
                  </p>
                </div>
                <DuoButton
                  variant="danger"
                  size="icon-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.student.id);
                  }}
                  disabled={removingId === item.student.id}
                >
                  {removingId === item.student.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserMinus className="h-4 w-4" />
                  )}
                </DuoButton>
              </div>
            </DuoCard.Root>
          ))}
        </SlideIn>
      )}

      <AddPersonalStudentModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={onRefresh}
        affiliations={affiliations}
      />
    </div>
  );
}
