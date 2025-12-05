"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import {
  mockGymStats,
  mockGymProfile,
  mockRecentCheckIns,
  mockStudents,
  mockEquipment,
} from "@/lib/gym-mock-data";
import { Users, Dumbbell } from "lucide-react";
import { useState, useEffect } from "react";

function RelativeTime({ timestamp }: { timestamp: Date }) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  const calculateTimeAgo = (baseTime: number) => {
    const diff = baseTime - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) {
      return `${minutes}m atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return `${Math.floor(hours / 24)}d atrás`;
    }
  };

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      setTimeAgo(calculateTimeAgo(Date.now()));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [timestamp]);

  if (!mounted) {
    return <span suppressHydrationWarning>—</span>;
  }

  return <span>{timeAgo || "—"}</span>;
}

export function GymDashboardPage() {
  const { today, week, month } = mockGymStats;

  const equipmentInUse = mockEquipment.filter((eq) => eq.status === "in-use");
  const equipmentMaintenance = mockEquipment.filter(
    (eq) => eq.status === "maintenance"
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900 md:text-4xl">
          Dashboard
        </h1>
        <p className="text-sm text-gray-600 md:text-lg">
          Visão geral da sua academia em tempo real
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 border-[#58CC02] bg-gradient-to-br from-[#58CC02]/10 to-white p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Check-ins Hoje
              </p>
              <p className="text-3xl font-black text-[#58CC02] md:text-4xl">
                {today.checkins}
              </p>
            </div>
            <div className="rounded-2xl bg-[#58CC02] p-3 md:p-4">
              <Users className="h-6 w-6 text-white md:h-8 md:w-8" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600">Pico: {today.peakHour}</p>
        </Card>

        <Card className="border-2 border-[#1CB0F6] bg-gradient-to-br from-[#1CB0F6]/10 to-white p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Alunos Ativos
              </p>
              <p className="text-3xl font-black text-[#1CB0F6] md:text-4xl">
                {today.activeStudents}
              </p>
            </div>
            <div className="rounded-2xl bg-[#1CB0F6] p-3 md:p-4">
              <Users className="h-6 w-6 text-white md:h-8 md:w-8" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Total: {mockGymProfile.totalStudents}
          </p>
        </Card>

        <Card className="border-2 border-[#FF9600] bg-gradient-to-br from-[#FF9600]/10 to-white p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Equipamentos em Uso
              </p>
              <p className="text-3xl font-black text-[#FF9600] md:text-4xl">
                {today.equipmentInUse}
              </p>
            </div>
            <div className="rounded-2xl bg-[#FF9600] p-3 md:p-4">
              <Dumbbell className="h-6 w-6 text-white md:h-8 md:w-8" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Total: {mockEquipment.length}
          </p>
        </Card>

        <Card className="border-2 border-[#CE82FF] bg-gradient-to-br from-[#CE82FF]/10 to-white p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Novos Alunos
              </p>
              <p className="text-3xl font-black text-[#CE82FF] md:text-4xl">
                +{week.newMembers}
              </p>
            </div>
            <div className="rounded-2xl bg-[#CE82FF] p-3 md:p-4">
              <Users className="h-6 w-6 text-white md:h-8 md:w-8" />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600">Esta semana</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2 p-4 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold md:text-xl">
            <Users className="h-5 w-5 text-[#58CC02]" />
            Check-ins Recentes
          </h2>
          <div className="space-y-3">
            {mockRecentCheckIns.map((checkin) => {
              const student = mockStudents.find(
                (s) => s.id === checkin.studentId
              );
              return (
                <div
                  key={checkin.id}
                  className="flex items-center gap-3 rounded-xl border-2 p-3 transition-all hover:border-[#58CC02]"
                >
                  {student?.avatar && (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full md:h-12 md:w-12">
                      <Image
                        src={student.avatar || "/placeholder.svg"}
                        alt={student.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 md:text-base">
                      {checkin.studentName}
                    </p>
                    <p className="text-xs text-gray-600 md:text-sm">
                      <RelativeTime timestamp={checkin.timestamp} />
                    </p>
                  </div>
                  <div className="rounded-full bg-[#58CC02] p-1.5 md:px-3 md:py-1">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="border-2 p-4 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold md:text-xl">
            <Dumbbell className="h-5 w-5 text-[#FF9600]" />
            Equipamentos em Tempo Real
          </h2>
          <div className="space-y-3">
            {equipmentInUse.map((eq) => (
              <div
                key={eq.id}
                className="rounded-xl border-2 border-[#FF9600] bg-[#FF9600]/5 p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900 md:text-base">
                      {eq.name}
                    </p>
                    <p className="text-xs text-gray-600 md:text-sm">
                      {eq.currentUser?.studentName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      <RelativeTime timestamp={eq.currentUser!.startTime} />
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {equipmentMaintenance.length > 0 && (
              <>
                <div className="my-2 border-t-2" />
                <h3 className="flex items-center gap-2 text-sm font-bold text-orange-600">
                  <Users className="h-4 w-4" />
                  Em Manutenção
                </h3>
                {equipmentMaintenance.map((eq) => (
                  <div
                    key={eq.id}
                    className="rounded-xl border-2 border-orange-500 bg-orange-50 p-3"
                  >
                    <p className="text-sm font-bold text-gray-900 md:text-base">
                      {eq.name}
                    </p>
                    <p className="text-xs text-orange-600 md:text-sm">
                      Aguardando manutenção
                    </p>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>

        <Card className="border-2 p-4 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold md:text-xl">
            <Users className="h-5 w-5 text-[#CE82FF]" />
            Top Alunos do Mês
          </h2>
          <div className="space-y-3">
            {month.topStudents.slice(0, 5).map((student, index) => (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-xl border-2 p-3 transition-all hover:border-[#CE82FF]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#CE82FF] to-[#FF9600] text-sm font-black text-white md:h-10 md:w-10 md:text-lg">
                  {index + 1}
                </div>
                {student.avatar && (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full md:h-12 md:w-12">
                    <Image
                      src={student.avatar || "/placeholder.svg"}
                      alt={student.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 md:text-base">
                    {student.name}
                  </p>
                  <p className="text-xs text-gray-600 md:text-sm">
                    {student.totalVisits} treinos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#58CC02] md:text-base">
                    {student.attendanceRate}%
                  </p>
                  <p className="text-xs text-gray-500">frequência</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-2 p-4 md:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold md:text-xl">
            <Users className="h-5 w-5 text-[#1CB0F6]" />
            Estatísticas da Semana
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-[#58CC02]/10 to-white p-4">
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Total de Check-ins
              </p>
              <p className="text-2xl font-black text-[#58CC02] md:text-3xl">
                {week.totalCheckins}
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-[#58CC02]" style={{ width: "85%" }} />
              </div>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-[#1CB0F6]/10 to-white p-4">
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Média Diária
              </p>
              <p className="text-2xl font-black text-[#1CB0F6] md:text-3xl">
                {week.avgDailyCheckins}
              </p>
              <p className="text-xs text-gray-600">alunos por dia</p>
            </div>

            <div className="rounded-xl bg-gradient-to-r from-[#CE82FF]/10 to-white p-4">
              <p className="text-xs font-bold text-gray-600 md:text-sm">
                Taxa de Retenção
              </p>
              <p className="text-2xl font-black text-[#CE82FF] md:text-3xl">
                {month.retentionRate}%
              </p>
              <p className="text-xs text-gray-600">últimos 30 dias</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

