"use client";

import { Loader2, Search, UserMinus, UserPlus } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import { usePersonalStudents } from "@/hooks/use-personal-students";
import { cn } from "@/lib/utils";
import { AddPersonalStudentModal } from "./add-personal-student-modal";
import { PersonalStudentDetail } from "./personal-student-detail";
import type { PersonalStudentAssignmentForDetail } from "./personal-student-detail/hooks/use-personal-student-detail";

export interface PersonalStudentItem {
  id: string;
  student: {
    id: string;
    avatar?: string | null;
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
          assignment={selectedAssignment as PersonalStudentAssignmentForDetail}
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-duo-text">
              Gestão de Alunos
            </h1>
            <p className="text-sm text-duo-gray-dark">
              {filteredStudents.length} aluno
              {filteredStudents.length !== 1 ? "s" : ""} encontrado
              {filteredStudents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <DuoButton onClick={() => setAssignModalOpen(true)}>
            <UserPlus className="h-5 w-5" />
            Atribuir aluno
          </DuoButton>
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
              <h2 className="font-bold text-duo-fg">
                Buscar e Filtrar
              </h2>
            </div>
          </DuoCard.Header>
          <div className="space-y-4">
            <DuoInput.Simple
              placeholder="Buscar por nome ou email..."
              value={searchQuery || ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5" />}
              className="h-12"
            />
            <div className="flex flex-wrap gap-2">
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
            )}
          </div>
        </DuoCard.Root>
      </SlideIn>

      {filteredStudents.length === 0 ? (
        <SlideIn delay={0.2}>
          <DuoCard.Root
            variant="default"
            size="default"
            className="p-12 text-center"
          >
            <p className="text-xl font-bold text-duo-gray-dark">
              Nenhum aluno encontrado
            </p>
            <p className="text-duo-gray-dark">
              {students.length === 0
                ? "Atribua alunos usando o botão acima."
                : "Tente ajustar os filtros de busca"}
            </p>
          </DuoCard.Root>
        </SlideIn>
      ) : (
        <SlideIn delay={0.2}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
              >
                <DuoCard.Root
                  variant="default"
                  size="default"
                  onClick={() => handleOpenDetail(item.student.id)}
                  className="cursor-pointer transition-all hover:border-duo-green active:scale-[0.98]"
                >
                  <div className="mb-4 flex items-start gap-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={
                          item.student?.avatar ||
                          "/placeholder.svg"
                        }
                        alt={item.student?.user?.name ?? "Aluno"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold text-duo-text">
                        {item.student?.user?.name ?? "Aluno"}
                      </h3>
                      <p className="text-sm text-duo-gray-dark">
                        {item.student?.user?.email ?? ""}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-xs font-bold",
                            item.gym?.id
                              ? "bg-duo-blue text-white"
                              : "bg-duo-purple/20 text-duo-purple",
                          )}
                        >
                          {item.gym?.name
                            ? `Via ${item.gym.name}`
                            : "Independente"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
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
              </motion.div>
            ))}
          </div>
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
