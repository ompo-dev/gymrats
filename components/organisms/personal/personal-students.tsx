"use client";

import { Loader2, Search, UserMinus, UserPlus } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import { apiClient } from "@/lib/api/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

const FILTER_ALL = "all";
const FILTER_INDEPENDENT = "independent";
const FILTER_VIA_GYM = "via_gym";

export function PersonalStudentsPage({
  students,
  affiliations,
  onRefresh,
}: PersonalStudentsPageProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [filter, setFilter] = useState<string>(FILTER_ALL);
  const [gymIdFilter, setGymIdFilter] = useState<string>("");
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignGymId, setAssignGymId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const filteredStudents = students.filter((item) => {
    const name = item.student?.user?.name ?? "";
    const email = item.student?.user?.email ?? "";
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      name.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;
    if (filter === FILTER_INDEPENDENT) return !item.gym?.id;
    if (filter === FILTER_VIA_GYM && gymIdFilter)
      return item.gym?.id === gymIdFilter;
    return true;
  });

  const handleAssign = async () => {
    if (!assignStudentId.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Informe o ID do aluno.",
      });
      return;
    }
    setIsAssigning(true);
    try {
      await apiClient.post("/api/personals/students/assign", {
        studentId: assignStudentId.trim(),
        ...(assignGymId ? { gymId: assignGymId } : {}),
      });
      toast({
        title: "Aluno atribuído",
        description: "O aluno foi vinculado a você.",
      });
      setAssignStudentId("");
      setAssignGymId("");
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao atribuir aluno";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    setRemovingId(studentId);
    try {
      await apiClient.delete("/api/personals/students/assign", {
        data: { studentId },
      });
      toast({
        title: "Vínculo removido",
        description: "O aluno deixou de estar atribuído a você.",
      });
      await onRefresh();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data
              ?.error
          : err instanceof Error
            ? err.message
            : "Erro ao remover";
      toast({
        variant: "destructive",
        title: "Erro",
        description: String(msg),
      });
    } finally {
      setRemovingId(null);
    }
  };

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
        <div className="mt-3 space-y-3">
          <DuoInput.Simple
            label="ID do aluno"
            placeholder="ID do aluno (UUID)"
            value={assignStudentId}
            onChange={(e) => setAssignStudentId(e.target.value)}
          />
          {affiliations.length > 0 && (
            <DuoSelect.Simple
              label="Via academia (opcional)"
              value={assignGymId}
              onChange={setAssignGymId}
              options={[
                { value: "", label: "Atendimento independente" },
                ...affiliations.map((a) => ({
                  value: a.gym.id,
                  label: a.gym.name,
                })),
              ]}
            />
          )}
          <DuoButton
            onClick={handleAssign}
            disabled={isAssigning || !assignStudentId.trim()}
            variant="primary"
          >
            {isAssigning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Atribuir
          </DuoButton>
        </div>
      </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.3}>
      <DuoCard.Root>
        <h3 className="font-semibold text-duo-fg">Filtro</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter(FILTER_ALL)}
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
            onClick={() => {
              setFilter(FILTER_INDEPENDENT);
              setGymIdFilter("");
            }}
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
              onClick={() => setFilter(FILTER_VIA_GYM)}
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
              <div>
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
                onClick={() => handleRemove(item.student.id)}
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
    </div>
  );
}
