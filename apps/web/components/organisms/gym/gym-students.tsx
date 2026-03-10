"use client";

import { Flame, Loader2, Search, UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { getGymStudentById, getGymStudentPayments } from "@/app/gym/actions";
import {
  getPersonalStudentById,
  getPersonalStudentPayments,
} from "@/app/personal/actions";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { DuoButton, DuoCard, DuoInput, DuoSelect } from "@/components/duo";
import { useGym } from "@/hooks/use-gym";
import type { Payment, StudentData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AddPersonalStudentModal } from "@/components/organisms/personal/add-personal-student-modal";
import { AddStudentModal } from "./add-student-modal";
import { GymStudentDetail } from "./gym-student-detail";

interface StudentDetailLoaderProps {
  studentId: string;
  fallbackStudent: StudentData | null;
  onBack: () => void;
  variant?: "gym" | "personal";
}

function StudentDetailLoader({
  studentId,
  fallbackStudent,
  onBack,
  variant = "gym",
}: StudentDetailLoaderProps) {
  const [student, setStudent] = useState<StudentData | null>(fallbackStudent);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getStudentById =
    variant === "personal" ? getPersonalStudentById : getGymStudentById;
  const getStudentPayments =
    variant === "personal" ? getPersonalStudentPayments : getGymStudentPayments;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const [fullStudent, studentPayments] = await Promise.all([
          getStudentById(studentId),
          getStudentPayments(studentId),
        ]);
        if (!cancelled) {
          setStudent(fullStudent ?? fallbackStudent);
          setPayments(studentPayments ?? []);
        }
      } catch {
        if (!cancelled) setStudent(fallbackStudent);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [studentId, fallbackStudent, getStudentById, getStudentPayments]);

  if (isLoading && !student) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-duo-gray-dark" />
      </div>
    );
  }

  return (
    <GymStudentDetail
      student={student}
      payments={payments}
      onBack={onBack}
      variant={variant}
    />
  );
}

interface PersonalAffiliationOption {
  id: string;
  gym: { id: string; name: string };
}

interface GymStudentsPageProps {
  students?: StudentData[];
  variant?: "gym" | "personal";
  personalAffiliations?: PersonalAffiliationOption[];
}

export function GymStudentsPage({
  students = [],
  variant = "gym",
  personalAffiliations = [],
}: GymStudentsPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const membershipPlans = useGym("membershipPlans");

  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("active"),
  );
  const [networkFilter, setNetworkFilter] = useQueryState("network", {
    defaultValue: "all",
  });
  const [gymFilter, setGymFilter] = useQueryState("gym", {
    defaultValue: "all",
  });
  const [studentId, setStudentId] = useQueryState("studentId");

  const safeStudents = Array.isArray(students) ? students : [];
  const filteredStudents = safeStudents.filter((student) => {
    const s = student as {
      name?: string;
      email?: string;
      membershipStatus?: string;
      status?: string;
      student?: { user?: { name?: string; email?: string } };
      gymMembership?: { gymId?: string };
    };
    const name = s.name ?? s.student?.user?.name ?? "";
    const email = s.email ?? s.student?.user?.email ?? "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase());
    const status =
      s.membershipStatus ?? (student as { status?: string }).status ?? "active";
    const isActive = status === "active";
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && isActive) ||
      (statusFilter === "inactive" && !isActive);

    // Personal variant specific filters
    if (variant === "personal") {
      const studentGymId = s.gymMembership?.gymId;
      const matchesNetwork =
        networkFilter === "all" ||
        (networkFilter === "personal" && !studentGymId) ||
        (networkFilter === "gym" && !!studentGymId);

      const matchesGym =
        networkFilter !== "gym" ||
        gymFilter === "all" ||
        (networkFilter === "gym" && studentGymId === gymFilter);

      return matchesSearch && matchesStatus && matchesNetwork && matchesGym;
    }

    return matchesSearch && matchesStatus;
  });

  const getStreakColor = (streak: number) => {
    if (streak >= 20) return "text-duo-orange";
    if (streak >= 10) return "text-duo-green";
    return "text-duo-gray-dark";
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "bg-duo-green";
    if (rate >= 70) return "bg-duo-blue";
    if (rate >= 50) return "bg-duo-orange";
    return "bg-duo-red";
  };

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
    ...personalAffiliations.map((aff) => ({
      value: aff.gym.id,
      label: aff.gym.name,
    })),
  ];

  if (studentId) {
    return (
      <StudentDetailLoader
        studentId={studentId}
        fallbackStudent={safeStudents.find((s) => s.id === studentId) ?? null}
        onBack={() => setStudentId(null)}
        variant={variant}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
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
          <DuoButton onClick={() => setIsModalOpen(true)}>
            <UserPlus className="h-5 w-5" />
            Novo Aluno
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
              <h2 className="font-bold text-[var(--duo-fg)]">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DuoSelect.Simple
                options={statusOptions}
                value={statusFilter || "all"}
                onChange={(value) =>
                  setStatusFilter(value as "all" | "active" | "inactive")
                }
                placeholder="Status"
              />
              {variant === "personal" && (
                <DuoSelect.Simple
                  options={networkOptions}
                  value={networkFilter || "all"}
                  onChange={(value) => setNetworkFilter(value as string)}
                  placeholder="Tipo de Vínculo"
                />
              )}
            </div>

            <AnimatePresence>
              {variant === "personal" && networkFilter === "gym" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <DuoSelect.Simple
                    options={gymOptions}
                    value={gymFilter || "all"}
                    onChange={(value) => setGymFilter(value as string)}
                    placeholder="Selecione a Academia"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DuoCard.Root>
      </SlideIn>

      <SlideIn delay={0.2}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <DuoCard.Root
                variant="default"
                size="default"
                onClick={() => setStudentId(student.id)}
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
                          (student as { status?: string }).status) === "active"
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
                        {student.gymMembership?.gymName ?? "Atendimento independente"}
                      </span>
                    </p>
                  </DuoCard.Root>
                ) : (
                  student.assignedTrainer && (
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
                  )
                )}
              </DuoCard.Root>
            </motion.div>
          ))}
        </div>
      </SlideIn>

      {filteredStudents.length === 0 && (
        <SlideIn delay={0.3}>
          <DuoCard.Root
            variant="default"
            size="default"
            className="p-12 text-center"
          >
            <p className="text-xl font-bold text-duo-gray-dark">
              Nenhum aluno encontrado
            </p>
            <p className="text-duo-gray-dark">
              Tente ajustar os filtros de busca
            </p>
          </DuoCard.Root>
        </SlideIn>
      )}

      {variant === "personal" ? (
        <AddPersonalStudentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            router.refresh();
          }}
          affiliations={personalAffiliations}
        />
      ) : (
        <AddStudentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => setIsModalOpen(false)}
          membershipPlans={membershipPlans}
        />
      )}
    </div>
  );
}
