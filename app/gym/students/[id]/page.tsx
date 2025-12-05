"use client"

import { mockStudents, mockPayments } from "@/lib/gym-mock-data"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { use, useState } from "react"
import { cn } from "@/lib/utils"

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const student = mockStudents.find((s) => s.id === id)
  const [studentPayments, setStudentPayments] = useState(mockPayments.filter((p) => p.studentId === id))

  if (!student) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
          <Card className="border-2 p-12 text-center">
            <p className="text-xl font-bold text-gray-500">Aluno não encontrado</p>
            <Link href="/gym/students">
              <Button className="mt-4">Voltar para Alunos</Button>
            </Link>
          </Card>
      </div>
    )
  }

  // Function to toggle payment status
  const togglePaymentStatus = (paymentId: string) => {
    setStudentPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          return {
            ...p,
            status: p.status === "paid" ? "pending" : "paid",
            date: p.status === "paid" ? p.date : new Date(),
          }
        }
        return p
      }),
    )
  }

  return (
    <div className="p-8">
        {/* Back Button */}
        <Link href="/gym/students">
          <Button variant="ghost" className="mb-4 gap-2 font-bold">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Alunos
          </Button>
        </Link>

        {/* Student Header */}
        <Card className="mb-6 border-2 p-8">
          <div className="flex items-start gap-6">
            <div className="relative h-32 w-32 overflow-hidden rounded-full">
              <Image src={student.avatar || "/placeholder.svg"} alt={student.name} fill className="object-cover" />
            </div>
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-4xl font-black text-gray-900">{student.name}</h1>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold ${
                    student.membershipStatus === "active" ? "bg-[#58CC02] text-white" : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {student.membershipStatus === "active" ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="mb-4 space-y-1 text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{student.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Membro desde {student.joinDate.toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="gap-2 bg-[#58CC02] hover:bg-[#47A302]">
                  <Edit className="h-4 w-4" />
                  Editar Perfil
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Dumbbell className="h-4 w-4" />
                  Atribuir Treino
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Apple className="h-4 w-4" />
                  Atribuir Dieta
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card className="border-2 border-[#FF9600] bg-gradient-to-br from-[#FF9600]/10 to-white p-6">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 fill-[#FF9600] text-[#FF9600]" />
              <div>
                <p className="text-sm font-bold text-gray-600">Sequência</p>
                <p className="text-3xl font-black text-[#FF9600]">{student.currentStreak}</p>
              </div>
            </div>
          </Card>

          <Card className="border-2 border-[#1CB0F6] bg-gradient-to-br from-[#1CB0F6]/10 to-white p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-[#1CB0F6]" />
              <div>
                <p className="text-sm font-bold text-gray-600">Nível</p>
                <p className="text-3xl font-black text-[#1CB0F6]">{student.progress.currentLevel}</p>
              </div>
            </div>
          </Card>

          <Card className="border-2 border-[#58CC02] bg-gradient-to-br from-[#58CC02]/10 to-white p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-[#58CC02]" />
              <div>
                <p className="text-sm font-bold text-gray-600">Treinos</p>
                <p className="text-3xl font-black text-[#58CC02]">{student.totalVisits}</p>
              </div>
            </div>
          </Card>

          <Card className="border-2 border-[#CE82FF] bg-gradient-to-br from-[#CE82FF]/10 to-white p-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-[#CE82FF]" />
              <div>
                <p className="text-sm font-bold text-gray-600">Frequência</p>
                <p className="text-3xl font-black text-[#CE82FF]">{student.attendanceRate}%</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="workouts">Treinos</TabsTrigger>
            <TabsTrigger value="diet">Dieta</TabsTrigger>
            <TabsTrigger value="progress">Progresso</TabsTrigger>
            <TabsTrigger value="records">Recordes</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Perfil */}
              <Card className="border-2 p-6">
                <h2 className="mb-4 text-xl font-bold">Informações do Perfil</h2>
                <div className="space-y-3">
                  <div className="flex justify-between rounded-xl border-2 p-3">
                    <span className="font-bold text-gray-600">Idade</span>
                    <span className="text-gray-900">{student.age} anos</span>
                  </div>
                  <div className="flex justify-between rounded-xl border-2 p-3">
                    <span className="font-bold text-gray-600">Gênero</span>
                    <span className="text-gray-900">{student.gender === "male" ? "Masculino" : "Feminino"}</span>
                  </div>
                  <div className="flex justify-between rounded-xl border-2 p-3">
                    <span className="font-bold text-gray-600">Altura</span>
                    <span className="text-gray-900">{student.profile.height}cm</span>
                  </div>
                  <div className="flex justify-between rounded-xl border-2 p-3">
                    <span className="font-bold text-gray-600">Peso Atual</span>
                    <span className="text-gray-900">{student.currentWeight}kg</span>
                  </div>
                  <div className="flex justify-between rounded-xl border-2 p-3">
                    <span className="font-bold text-gray-600">Nível</span>
                    <span className="text-gray-900 capitalize">{student.profile.fitnessLevel}</span>
                  </div>
                  <div className="flex justify-between rounded-xl border-2 p-3">
                    <span className="font-bold text-gray-600">Frequência Semanal</span>
                    <span className="text-gray-900">{student.profile.weeklyWorkoutFrequency}x semana</span>
                  </div>
                </div>
              </Card>

              {/* Objetivos */}
              <Card className="border-2 p-6">
                <h2 className="mb-4 text-xl font-bold">Objetivos</h2>
                <div className="space-y-2">
                  {student.profile.goals.map((goal, index) => (
                    <div key={index} className="rounded-xl border-2 border-[#58CC02] bg-[#58CC02]/10 p-3">
                      <p className="font-bold capitalize text-gray-900">{goal.replace("-", " ")}</p>
                    </div>
                  ))}
                </div>

                <h3 className="mb-3 mt-6 font-bold text-gray-700">Equipamentos Favoritos</h3>
                <div className="space-y-2">
                  {student.favoriteEquipment.map((equipment, index) => (
                    <div key={index} className="flex items-center gap-2 rounded-xl border-2 p-2">
                      <Dumbbell className="h-4 w-4 text-[#FF9600]" />
                      <span className="text-sm text-gray-700">{equipment}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Evolução de Peso */}
              <Card className="border-2 p-6 lg:col-span-2">
                <h2 className="mb-4 text-xl font-bold">Evolução de Peso</h2>
                <div className="space-y-2">
                  {student.weightHistory.map((record, index) => (
                    <div key={index} className="flex items-center gap-4 rounded-xl border-2 p-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="flex-1 font-bold text-gray-700">{record.date.toLocaleDateString("pt-BR")}</span>
                      <span className="text-2xl font-black text-[#1CB0F6]">{record.weight}kg</span>
                      {index < student.weightHistory.length - 1 && (
                        <div className="flex items-center gap-1">
                          {record.weight < student.weightHistory[index + 1].weight ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-red-500" />
                              <span className="text-sm font-bold text-red-500">
                                +{(record.weight - student.weightHistory[index + 1].weight).toFixed(1)}kg
                              </span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="h-4 w-4 rotate-180 text-[#58CC02]" />
                              <span className="text-sm font-bold text-[#58CC02]">
                                {(record.weight - student.weightHistory[index + 1].weight).toFixed(1)}kg
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="workouts">
            <Card className="border-2 p-6">
              <h2 className="mb-4 text-xl font-bold">Histórico de Treinos</h2>
              <p className="text-gray-500">Implementação do histórico de treinos em desenvolvimento...</p>
            </Card>
          </TabsContent>

          <TabsContent value="diet">
            <Card className="border-2 p-6">
              <h2 className="mb-4 text-xl font-bold">Plano de Dieta</h2>
              <div className="space-y-4">
                <div className="rounded-xl border-2 p-4">
                  <p className="font-bold text-gray-700">Meta Calórica Diária</p>
                  <p className="text-3xl font-black text-[#FF9600]">{student.profile.targetCalories} kcal</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border-2 p-4 text-center">
                    <p className="text-sm font-bold text-gray-600">Proteína</p>
                    <p className="text-2xl font-black text-[#58CC02]">{student.profile.targetProtein}g</p>
                  </div>
                  <div className="rounded-xl border-2 p-4 text-center">
                    <p className="text-sm font-bold text-gray-600">Carboidratos</p>
                    <p className="text-2xl font-black text-[#1CB0F6]">{student.profile.targetCarbs || 250}g</p>
                  </div>
                  <div className="rounded-xl border-2 p-4 text-center">
                    <p className="text-sm font-bold text-gray-600">Gorduras</p>
                    <p className="text-2xl font-black text-[#CE82FF]">{student.profile.targetFats || 70}g</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card className="border-2 p-6">
              <h2 className="mb-4 text-xl font-bold">Progresso e XP</h2>
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-bold text-gray-700">Nível {student.progress.currentLevel}</span>
                  <span className="text-sm text-gray-600">
                    {student.progress.totalXP} / {student.progress.totalXP + student.progress.xpToNextLevel} XP
                  </span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-[#58CC02] to-[#47A302]"
                    style={{
                      width: `${(student.progress.totalXP / (student.progress.totalXP + student.progress.xpToNextLevel)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <h3 className="mb-3 font-bold">Atividade Semanal</h3>
              <div className="grid grid-cols-7 gap-2">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => (
                  <div key={index} className="text-center">
                    <p className="mb-2 text-xs font-bold text-gray-600">{day}</p>
                    <div className="rounded-xl border-2 p-3">
                      <p className="text-lg font-black text-[#58CC02]">{student.progress.weeklyXP[index]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="records">
            <Card className="border-2 p-6">
              <h2 className="mb-4 text-xl font-bold">Recordes Pessoais</h2>
              <div className="space-y-3">
                {student.personalRecords.map((record, index) => (
                  <div key={index} className="rounded-xl border-2 border-[#FF9600] bg-[#FF9600]/10 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900">{record.exerciseName}</p>
                        <p className="text-sm text-gray-600">{record.date.toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-[#FF9600]">{record.value}kg</p>
                        <p className="text-xs font-bold text-gray-600 capitalize">{record.type.replace("-", " ")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-2 p-6">
              <h2 className="mb-4 text-xl font-bold">Histórico de Pagamentos</h2>

              <div className="mb-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border-2 border-[#58CC02] bg-[#58CC02]/10 p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-[#58CC02]" />
                    <div>
                      <p className="text-sm font-bold text-gray-600">Pagos</p>
                      <p className="text-2xl font-black text-[#58CC02]">
                        {studentPayments.filter((p) => p.status === "paid").length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-[#FF9600] bg-[#FF9600]/10 p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-[#FF9600]" />
                    <div>
                      <p className="text-sm font-bold text-gray-600">Pendentes</p>
                      <p className="text-2xl font-black text-[#FF9600]">
                        {studentPayments.filter((p) => p.status === "pending").length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border-2 border-[#1CB0F6] bg-[#1CB0F6]/10 p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-[#1CB0F6]" />
                    <div>
                      <p className="text-sm font-bold text-gray-600">Total Pago</p>
                      <p className="text-xl font-black text-[#1CB0F6]">
                        R${" "}
                        {studentPayments
                          .filter((p) => p.status === "paid")
                          .reduce((sum, p) => sum + p.amount, 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {studentPayments.map((payment) => (
                  <div key={payment.id} className="rounded-xl border-2 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{payment.planName}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Vencimento: {payment.dueDate.toLocaleDateString("pt-BR")}
                        </p>
                        {payment.status === "paid" && (
                          <p className="text-sm text-gray-600">Pago em: {payment.date.toLocaleDateString("pt-BR")}</p>
                        )}
                        <p className="text-sm text-gray-600 capitalize">
                          Método: {payment.paymentMethod.replace("-", " ")}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-black text-[#1CB0F6] mb-2">R$ {payment.amount.toFixed(2)}</p>

                        <button
                          onClick={() => togglePaymentStatus(payment.id)}
                          className={cn(
                            "px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                            payment.status === "paid"
                              ? "bg-[#58CC02] text-white hover:bg-[#47A302]"
                              : "bg-[#FF9600] text-white hover:bg-[#E68600]",
                          )}
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
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
    </div>
  )
}
