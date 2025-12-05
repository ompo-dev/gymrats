"use client"

import { mockGymStats, mockEquipment } from "@/lib/gym-mock-data"
import { TrendingUp, Users, Activity, Dumbbell, Calendar, Clock, Target } from "lucide-react"
import { useRouter } from "next/navigation"

export function GymStatsPage() {

  const weeklyData = [
    { day: "Seg", checkins: 58, value: 70 },
    { day: "Ter", checkins: 62, value: 75 },
    { day: "Qua", checkins: 71, value: 86 },
    { day: "Qui", checkins: 68, value: 82 },
    { day: "Sex", checkins: 75, value: 91 },
    { day: "Sáb", checkins: 54, value: 65 },
    { day: "Dom", checkins: 35, value: 42 },
  ]

  const hourlyData = [
    { hour: "6h", students: 12 },
    { hour: "8h", students: 28 },
    { hour: "10h", students: 45 },
    { hour: "12h", students: 32 },
    { hour: "14h", students: 25 },
    { hour: "16h", students: 38 },
    { hour: "18h", students: 67 },
    { hour: "20h", students: 54 },
    { hour: "22h", students: 18 },
  ]

  const maxHourlyStudents = Math.max(...hourlyData.map((d) => d.students))

  return (
    <div className="container px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-black text-duo-gray-darkest">Estatísticas Detalhadas</h1>
          <p className="text-sm text-duo-gray-dark">Análise completa do desempenho da academia</p>
        </div>

        {/* Métricas Principais */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <Users className="h-5 w-5 text-blue-500" />
              <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                <TrendingUp className="h-3 w-3" />
                +8%
              </div>
            </div>
            <div className="text-2xl font-black text-blue-600">{mockGymStats.week.totalCheckins}</div>
            <div className="text-xs font-bold text-duo-gray-dark">Check-ins Semana</div>
          </div>

          <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <Activity className="h-5 w-5 text-green-500" />
              <div className="flex items-center gap-1 text-xs font-bold text-green-600">
                <TrendingUp className="h-3 w-3" />
                +5%
              </div>
            </div>
            <div className="text-2xl font-black text-green-600">{mockGymStats.month.retentionRate}%</div>
            <div className="text-xs font-bold text-duo-gray-dark">Taxa Retenção</div>
          </div>

          <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <Target className="h-5 w-5 text-purple-500" />
              <div className="flex items-center gap-1 text-xs font-bold text-duo-gray-dark">85%</div>
            </div>
            <div className="text-2xl font-black text-purple-600">{mockGymStats.week.avgDailyCheckins}</div>
            <div className="text-xs font-bold text-duo-gray-dark">Média Diária</div>
          </div>

          <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <Dumbbell className="h-5 w-5 text-orange-500" />
              <div className="flex items-center gap-1 text-xs font-bold text-orange-600">78%</div>
            </div>
            <div className="text-2xl font-black text-orange-600">{mockEquipment.length}</div>
            <div className="text-xs font-bold text-duo-gray-dark">Equipamentos Ativos</div>
          </div>
        </div>

        {/* Check-ins por Dia da Semana */}
        <div className="mb-6 rounded-2xl border-2 border-duo-border bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-duo-green" />
            <h2 className="text-lg font-black text-duo-gray-darkest">Check-ins por Dia</h2>
          </div>

          <div className="space-y-3">
            {weeklyData.map((day) => (
              <div key={day.day} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-duo-gray-dark">{day.day}</span>
                  <span className="font-black text-duo-gray-darkest">{day.checkins}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-duo-green to-green-400 transition-all"
                    style={{ width: `${day.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horários Populares */}
        <div className="mb-6 rounded-2xl border-2 border-duo-border bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#FF9600]" />
            <h2 className="text-lg font-black text-duo-gray-darkest">Horários Populares</h2>
          </div>

          <div className="space-y-2">
            {hourlyData.map((item) => (
              <div key={item.hour} className="flex items-center gap-3">
                <div className="w-8 text-xs font-bold text-duo-gray-dark">{item.hour}</div>
                <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-gray-100">
                  <div
                    className="flex h-full items-center rounded-lg bg-gradient-to-r from-[#FF9600] to-orange-400 px-2 text-xs font-black text-white transition-all"
                    style={{ width: `${(item.students / maxHourlyStudents) * 100}%` }}
                  >
                    {item.students > 15 && item.students}
                  </div>
                </div>
                <div className="w-8 text-right text-xs font-bold text-duo-gray-darkest">{item.students}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Equipamentos */}
        <div className="rounded-2xl border-2 border-duo-border bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-duo-blue" />
            <h2 className="text-lg font-black text-duo-gray-darkest">Equipamentos Mais Usados</h2>
          </div>

          <div className="space-y-3">
            {mockEquipment.slice(0, 5).map((eq, index) => (
              <div key={eq.id} className="flex items-center gap-3 rounded-xl border-2 border-gray-100 bg-gray-50 p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-duo-blue text-sm font-black text-white">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-black text-duo-gray-darkest">{eq.name}</div>
                  <div className="text-xs text-duo-gray-dark">{eq.usageStats.totalUses} usos</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-duo-blue">{eq.usageStats.avgUsageTime}min</div>
                  <div className="text-xs text-duo-gray-dark">média</div>
                </div>
              </div>
            ))}
          </div>
        </div>
    </div>
  )
}
