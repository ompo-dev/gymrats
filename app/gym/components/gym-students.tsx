"use client";

import { mockStudents } from "@/lib/gym-mock-data";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OptionSelector } from "@/components/ui/option-selector";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import { Search, UserPlus, Flame, Users } from "lucide-react";
import Image from "next/image";
import { useQueryState } from "nuqs";
import { cn } from "@/lib/utils";
import { GymStudentDetail } from "./gym-student-detail";

export function GymStudentsPage() {
  const [searchQuery, setSearchQuery] = useQueryState("search", {
    defaultValue: "",
  });
  const [statusFilter, setStatusFilter] = useQueryState<
    "all" | "active" | "inactive"
  >("status", {
    defaultValue: "all",
  });
  const [studentId, setStudentId] = useQueryState("studentId");

  const filteredStudents = mockStudents.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || student.membershipStatus === statusFilter;
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

  if (studentId) {
    return (
      <GymStudentDetail
        studentId={studentId}
        onBack={() => setStudentId(null)}
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
          <Button>
            <UserPlus className="h-5 w-5" />
            Novo Aluno
          </Button>
        </div>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title="Buscar e Filtrar" icon={Search}>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-duo-gray-dark" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10"
              />
            </div>
            <OptionSelector
              options={statusOptions}
              value={statusFilter || "all"}
              onChange={(value) =>
                setStatusFilter(value as "all" | "active" | "inactive")
              }
              layout="grid"
              columns={3}
              size="md"
              textAlign="center"
              animate={true}
            />
          </div>
        </SectionCard>
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
              <DuoCard
                variant="default"
                size="default"
                onClick={() => setStudentId(student.id)}
                className="cursor-pointer transition-all hover:border-duo-green active:scale-[0.98]"
              >
                <div className="mb-4 flex items-start gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={student.avatar || "/placeholder.svg"}
                      alt={student.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-duo-text">
                      {student.name}
                    </h3>
                    <p className="text-sm text-duo-gray-dark">
                      {student.email}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-bold",
                          student.membershipStatus === "active"
                            ? "bg-duo-green text-white"
                            : "bg-gray-300 text-duo-gray-dark"
                        )}
                      >
                        {student.membershipStatus === "active"
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <DuoCard variant="default" size="sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame
                          className={cn(
                            "h-5 w-5 fill-current",
                            getStreakColor(student.currentStreak)
                          )}
                        />
                        <span className="font-bold text-duo-text">
                          Sequência
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-xl font-bold",
                          getStreakColor(student.currentStreak)
                        )}
                      >
                        {student.currentStreak} dias
                      </span>
                    </div>
                  </DuoCard>

                  <DuoCard variant="default" size="sm">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-bold text-duo-text">
                        Frequência
                      </span>
                      <span className="text-xl font-bold text-duo-text">
                        {student.attendanceRate}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={cn(
                          "h-full transition-all",
                          getAttendanceColor(student.attendanceRate)
                        )}
                        style={{ width: `${student.attendanceRate}%` }}
                      />
                    </div>
                  </DuoCard>

                  <div className="grid grid-cols-2 gap-2">
                    <DuoCard
                      variant="blue"
                      size="sm"
                      className="p-3 text-center"
                    >
                      <p className="text-2xl font-bold text-duo-blue">
                        {student.totalVisits}
                      </p>
                      <p className="text-xs font-bold text-duo-gray-dark">
                        Treinos
                      </p>
                    </DuoCard>
                    <DuoCard
                      variant="default"
                      size="sm"
                      className="border-duo-purple bg-duo-purple/10 p-3 text-center"
                    >
                      <p className="text-2xl font-bold text-duo-purple">
                        {student.currentWeight}kg
                      </p>
                      <p className="text-xs font-bold text-duo-gray-dark">
                        Peso
                      </p>
                    </DuoCard>
                  </div>
                </div>

                {student.assignedTrainer && (
                  <DuoCard
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
                  </DuoCard>
                )}
              </DuoCard>
            </motion.div>
          ))}
        </div>
      </SlideIn>

      {filteredStudents.length === 0 && (
        <SlideIn delay={0.3}>
          <DuoCard
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
          </DuoCard>
        </SlideIn>
      )}
    </div>
  );
}
