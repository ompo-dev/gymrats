"use client";

import { mockStudents, mockPayments } from "@/lib/gym-mock-data";
import { Button } from "@/components/ui/button";
import { OptionSelector } from "@/components/ui/option-selector";
import { SectionCard } from "@/components/ui/section-card";
import { DuoCard } from "@/components/ui/duo-card";
import { StatCardLarge } from "@/components/ui/stat-card-large";
import { FadeIn } from "@/components/animations/fade-in";
import { SlideIn } from "@/components/animations/slide-in";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Flame,
  Trophy,
  TrendingUp,
  Dumbbell,
  Apple,
  Activity,
  Target,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface GymStudentDetailProps {
  studentId: string;
  onBack: () => void;
}

export function GymStudentDetail({ studentId, onBack }: GymStudentDetailProps) {
  const student = mockStudents.find((s) => s.id === studentId);
  const [studentPayments, setStudentPayments] = useState(
    mockPayments.filter((p) => p.studentId === studentId)
  );
  const [activeTab, setActiveTab] = useState("overview");

  if (!student) {
    return (
      <div className="mx-auto max-w-4xl space-y-6  ">
        <DuoCard variant="default" size="default" className="p-12 text-center">
          <p className="text-xl font-bold text-duo-gray-dark">
            Aluno não encontrado
          </p>
          <Button onClick={onBack} className="mt-4">
            Voltar para Alunos
          </Button>
        </DuoCard>
      </div>
    );
  }

  const togglePaymentStatus = (paymentId: string) => {
    setStudentPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          return {
            ...p,
            status: p.status === "paid" ? "pending" : "paid",
            date: p.status === "paid" ? p.date : new Date(),
          };
        }
        return p;
      })
    );
  };

  const tabOptions = [
    { value: "overview", label: "Visão Geral", emoji: "📊" },
    { value: "workouts", label: "Treinos", emoji: "💪" },
    { value: "diet", label: "Dieta", emoji: "🍎" },
    { value: "progress", label: "Progresso", emoji: "📈" },
    { value: "records", label: "Recordes", emoji: "🏆" },
    { value: "payments", label: "Pagamentos", emoji: "💳" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6  ">
      <FadeIn>
        <Button variant="ghost" onClick={onBack} className="gap-2 font-bold">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Alunos
        </Button>
      </FadeIn>

      <SlideIn delay={0.1}>
        <SectionCard title={student.name} icon={Users} variant="default">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full sm:mx-0 sm:h-32 sm:w-32">
              <Image
                src={student.avatar || "/placeholder.svg"}
                alt={student.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-bold",
                    student.membershipStatus === "active"
                      ? "bg-duo-green text-white"
                      : "bg-gray-300 text-duo-gray-dark"
                  )}
                >
                  {student.membershipStatus === "active" ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="mb-4 space-y-2 text-sm text-duo-gray-dark">
                <div className="flex items-center gap-2 break-words">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="break-all">{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>{student.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    Membro desde {student.joinDate.toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="flex-1 sm:flex-initial">
                  <Edit className="h-4 w-4" />
                  Editar Perfil
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                >
                  <Dumbbell className="h-4 w-4" />
                  Atribuir Treino
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                >
                  <Apple className="h-4 w-4" />
                  Atribuir Dieta
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>
      </SlideIn>

      <SlideIn delay={0.2}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCardLarge
            icon={Flame}
            value={String(student.currentStreak)}
            label="Sequência"
            iconColor="duo-orange"
          />
          <StatCardLarge
            icon={Trophy}
            value={String(student.progress.currentLevel)}
            label="Nível"
            iconColor="duo-blue"
          />
          <StatCardLarge
            icon={Activity}
            value={String(student.totalVisits)}
            label="Treinos"
            iconColor="duo-green"
          />
          <StatCardLarge
            icon={Target}
            value={`${student.attendanceRate}%`}
            label="Frequência"
            iconColor="duo-purple"
          />
        </div>
      </SlideIn>

      <SlideIn delay={0.3}>
        <SectionCard title="Selecione a Categoria" icon={Dumbbell}>
          <OptionSelector
            options={tabOptions}
            value={activeTab}
            onChange={(value) => setActiveTab(value)}
            layout="grid"
            columns={3}
            size="md"
            textAlign="center"
            animate={true}
          />
        </SectionCard>
      </SlideIn>

      {activeTab === "overview" && (
        <SlideIn delay={0.4}>
          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="Informações do Perfil" icon={Users}>
              <div className="space-y-3">
                {[
                  { label: "Idade", value: `${student.age} anos` },
                  {
                    label: "Gênero",
                    value: student.gender === "male" ? "Masculino" : "Feminino",
                  },
                  { label: "Altura", value: `${student.profile.height}cm` },
                  {
                    label: "Peso Atual",
                    value: `${student.currentWeight}kg`,
                  },
                  {
                    label: "Nível",
                    value: student.profile.fitnessLevel,
                  },
                  {
                    label: "Frequência Semanal",
                    value: `${student.profile.weeklyWorkoutFrequency}x semana`,
                  },
                ].map((info, index) => (
                  <DuoCard key={index} variant="default" size="sm">
                    <div className="flex justify-between">
                      <span className="font-bold text-duo-gray-dark">
                        {info.label}
                      </span>
                      <span className="text-duo-text">{info.value}</span>
                    </div>
                  </DuoCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Objetivos" icon={Target}>
              <div className="space-y-2">
                {student.profile.goals.map((goal, index) => (
                  <DuoCard
                    key={index}
                    variant="highlighted"
                    size="sm"
                    className="p-3"
                  >
                    <p className="font-bold capitalize text-duo-text">
                      {goal.replace("-", " ")}
                    </p>
                  </DuoCard>
                ))}
              </div>

              <h3 className="mb-3 mt-6 font-bold text-duo-text">
                Equipamentos Favoritos
              </h3>
              <div className="space-y-2">
                {student.favoriteEquipment.map((equipment, index) => (
                  <DuoCard key={index} variant="default" size="sm">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-duo-orange" />
                      <span className="text-sm text-duo-text">{equipment}</span>
                    </div>
                  </DuoCard>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Evolução de Peso"
              icon={TrendingUp}
              className="lg:col-span-2"
            >
              <div className="space-y-2">
                {student.weightHistory.map((record, index) => (
                  <DuoCard key={index} variant="default" size="sm">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-5 w-5 text-duo-gray-dark" />
                      <span className="flex-1 font-bold text-duo-text">
                        {record.date.toLocaleDateString("pt-BR")}
                      </span>
                      <span className="text-2xl font-bold text-duo-blue">
                        {record.weight}kg
                      </span>
                      {index < student.weightHistory.length - 1 && (
                        <div className="flex items-center gap-1">
                          {record.weight <
                          student.weightHistory[index + 1].weight ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-duo-red" />
                              <span className="text-sm font-bold text-duo-red">
                                +
                                {(
                                  student.weightHistory[index + 1].weight -
                                  record.weight
                                ).toFixed(1)}
                                kg
                              </span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-4 w-4 rotate-180 text-duo-green" />
                              <span className="text-sm font-bold text-duo-green">
                                {(
                                  record.weight -
                                  student.weightHistory[index + 1].weight
                                ).toFixed(1)}
                                kg
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </DuoCard>
                ))}
              </div>
            </SectionCard>
          </div>
        </SlideIn>
      )}

      {activeTab === "workouts" && (
        <SlideIn delay={0.4}>
          <SectionCard title="Histórico de Treinos" icon={Dumbbell}>
            <p className="text-duo-gray-dark">
              Implementação do histórico de treinos em desenvolvimento...
            </p>
          </SectionCard>
        </SlideIn>
      )}

      {activeTab === "diet" && (
        <SlideIn delay={0.4}>
          <SectionCard title="Plano de Dieta" icon={Apple}>
            <div className="space-y-4">
              <DuoCard variant="orange" size="default">
                <p className="font-bold text-duo-text">Meta Calórica Diária</p>
                <p className="text-3xl font-bold text-duo-orange">
                  {student.profile.targetCalories} kcal
                </p>
              </DuoCard>
              <div className="grid grid-cols-3 gap-4">
                <DuoCard
                  variant="highlighted"
                  size="sm"
                  className="p-4 text-center"
                >
                  <p className="text-sm font-bold text-duo-gray-dark">
                    Proteína
                  </p>
                  <p className="text-2xl font-bold text-duo-green">
                    {student.profile.targetProtein}g
                  </p>
                </DuoCard>
                <DuoCard variant="blue" size="sm" className="p-4 text-center">
                  <p className="text-sm font-bold text-duo-gray-dark">
                    Carboidratos
                  </p>
                  <p className="text-2xl font-bold text-duo-blue">
                    {student.profile.targetCarbs || 250}g
                  </p>
                </DuoCard>
                <DuoCard
                  variant="default"
                  size="sm"
                  className="border-duo-purple bg-duo-purple/10 p-4 text-center"
                >
                  <p className="text-sm font-bold text-duo-gray-dark">
                    Gorduras
                  </p>
                  <p className="text-2xl font-bold text-duo-purple">
                    {student.profile.targetFats || 70}g
                  </p>
                </DuoCard>
              </div>
            </div>
          </SectionCard>
        </SlideIn>
      )}

      {activeTab === "progress" && (
        <SlideIn delay={0.4}>
          <SectionCard title="Progresso e XP" icon={Activity}>
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-duo-text">
                  Nível {student.progress.currentLevel}
                </span>
                <span className="text-sm text-duo-gray-dark">
                  {student.progress.totalXP} /{" "}
                  {student.progress.totalXP + student.progress.xpToNextLevel} XP
                </span>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-duo-green"
                  style={{
                    width: `${
                      (student.progress.totalXP /
                        (student.progress.totalXP +
                          student.progress.xpToNextLevel)) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            <h3 className="mb-3 font-bold text-duo-text">Atividade Semanal</h3>
            <div className="grid grid-cols-7 gap-2">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
                <div key={index} className="text-center">
                  <p className="mb-2 text-xs font-bold text-duo-gray-dark">
                    {day}
                  </p>
                  <DuoCard variant="default" size="sm" className="p-3">
                    <p className="text-lg font-bold text-duo-green">
                      {student.progress.weeklyXP[index]}
                    </p>
                  </DuoCard>
                </div>
              ))}
            </div>
          </SectionCard>
        </SlideIn>
      )}

      {activeTab === "records" && (
        <SlideIn delay={0.4}>
          <SectionCard title="Recordes Pessoais" icon={Trophy}>
            <div className="space-y-3">
              {student.personalRecords.map((record, index) => (
                <DuoCard key={index} variant="orange" size="default">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-duo-text">
                        {record.exerciseName}
                      </p>
                      <p className="text-sm text-duo-gray-dark">
                        {record.date.toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-duo-orange">
                        {record.value}kg
                      </p>
                      <p className="text-xs font-bold text-duo-gray-dark capitalize">
                        {record.type.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                </DuoCard>
              ))}
            </div>
          </SectionCard>
        </SlideIn>
      )}

      {activeTab === "payments" && (
        <SlideIn delay={0.4}>
          <SectionCard title="Histórico de Pagamentos" icon={DollarSign}>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <DuoCard variant="highlighted" size="sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-duo-green" />
                  <div>
                    <p className="text-sm font-bold text-duo-gray-dark">
                      Pagos
                    </p>
                    <p className="text-2xl font-bold text-duo-green">
                      {
                        studentPayments.filter((p) => p.status === "paid")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </DuoCard>

              <DuoCard variant="orange" size="sm">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-duo-orange" />
                  <div>
                    <p className="text-sm font-bold text-duo-gray-dark">
                      Pendentes
                    </p>
                    <p className="text-2xl font-bold text-duo-orange">
                      {
                        studentPayments.filter((p) => p.status === "pending")
                          .length
                      }
                    </p>
                  </div>
                </div>
              </DuoCard>

              <DuoCard variant="blue" size="sm">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-6 w-6 text-duo-blue" />
                  <div>
                    <p className="text-sm font-bold text-duo-gray-dark">
                      Total Pago
                    </p>
                    <p className="text-xl font-bold text-duo-blue">
                      R${" "}
                      {studentPayments
                        .filter((p) => p.status === "paid")
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                </div>
              </DuoCard>
            </div>

            <div className="space-y-3">
              {studentPayments.map((payment, index) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                >
                  <DuoCard variant="default" size="default">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-duo-text">
                          {payment.planName}
                        </h3>
                        <p className="text-sm text-duo-gray-dark mt-1">
                          Vencimento:{" "}
                          {payment.dueDate.toLocaleDateString("pt-BR")}
                        </p>
                        {payment.status === "paid" && (
                          <p className="text-sm text-duo-gray-dark">
                            Pago em: {payment.date.toLocaleDateString("pt-BR")}
                          </p>
                        )}
                        <p className="text-sm text-duo-gray-dark capitalize">
                          Método: {payment.paymentMethod.replace("-", " ")}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-duo-blue mb-2">
                          R$ {payment.amount.toFixed(2)}
                        </p>

                        <Button
                          onClick={() => togglePaymentStatus(payment.id)}
                          variant={
                            payment.status === "paid" ? "default" : "outline"
                          }
                          size="sm"
                        >
                          {payment.status === "paid" ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Pago
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4" />
                              Marcar como Pago
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DuoCard>
                </motion.div>
              ))}
            </div>
          </SectionCard>
        </SlideIn>
      )}
    </div>
  );
}
